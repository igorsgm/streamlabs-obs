/**
 * This file provides patches for AVA that allow to track failed tests to re-run them
 * Also it skips the tests that should be run on an different CI agent in a parallel execution mode
 */

import avaTest, { ExecutionContext, TestInterface } from 'ava';
import { ITestContext, test } from './index';
import { uniq } from 'lodash';
const fs = require('fs');
const fetch = require('node-fetch');
const request = require('request');

export const USER_POOL_TOKEN = process.env.SLOBS_TEST_USER_POOL_TOKEN;
const USER_POOL_URL = 'https://slobs-users-pool.herokuapp.com';
const FAILED_TESTS_PATH = 'test-dist/failed-tests.json'; // failed will be written down to this file
const TESTS_TIMINGS_PATH = 'test-dist/test-timings.json'; // a known timings for tests should be provided in this file

// save names of all running tests in this array to use them in the retrying mechanism
const pendingTests: string[] = [];

// read timings for tests
const testTimings: Record<string, number> = (() => {
  try {
    // read the list of timings from the file
    const records: { name: string; time: number }[] = JSON.parse(
      fs.readFileSync(TESTS_TIMINGS_PATH, 'utf-8'),
    );
    const result = {};

    // convert the list to the map where key is a test name
    records.forEach(r => (result[r.name] = r.time));
    return result;
  } catch (e) {
    return {};
  }
})();

/**
 * overridden version of the ava.test() function
 */
export const testFn: TestInterface<ITestContext> = new Proxy(avaTest, {
  apply: (target, thisArg, args) => {
    const testName = args[0];
    if (!isTestEligibleToRun(testName)) {
      // skip tests that don't belong current slice
      avaTest.skip(`SKIP: ${testName}`, t => {});
      return;
    }
    pendingTests.push(testName);
    return target.apply(thisArg, args);
  },
});

avaTest.before(async t => {
  // consider all tests as failed until it's not successfully finished
  // so we can catch failures for tests with timeouts
  saveFailedTestsToFile(pendingTests);
});

export function saveFailedTestsToFile(failedTests: string[]) {
  if (fs.existsSync(FAILED_TESTS_PATH)) {
    // tslint:disable-next-line:no-parameter-reassignment TODO
    failedTests = JSON.parse(fs.readFileSync(FAILED_TESTS_PATH, 'utf8')).concat(failedTests);
  }
  fs.writeFileSync(FAILED_TESTS_PATH, JSON.stringify(uniq(failedTests)));
}

export function removeFailedTestFromFile(testName: string) {
  if (fs.existsSync(FAILED_TESTS_PATH)) {
    const failedTests = JSON.parse(fs.readFileSync(FAILED_TESTS_PATH, 'utf8'));
    failedTests.splice(failedTests.indexOf(testName), 1);
    fs.writeFileSync(FAILED_TESTS_PATH, JSON.stringify(failedTests));
  }
}

/**
 * check if test is eligible to run on the current CI agent
 */
function isTestEligibleToRun(testName: string) {
  const testAvgTime = testTimings[testName];

  // if we don't have a timing data for test then it's always eligible to run
  if (!testAvgTime) return true;

  // determine which chunk of the test suite is running now
  const chunk = process.env.SLOBS_TEST_RUN_CHUNK;

  // always allow test to run if no chunk data provided
  if (!chunk) return true;

  // get the amount of chunks and the chunk we should run on this agent
  const [currentChunkNum, totalChunks] = chunk.split('/').map(s => Number(s));

  // calculate the chunk number for the current test
  let testAvgStartTime = 0;
  let testAvgTotalTime = 0;
  Object.keys(testTimings).forEach(name => {
    testAvgTotalTime += testTimings[name];
    if (name === testName) testAvgStartTime = testAvgTotalTime;
  });
  const timePerChunk = testAvgTotalTime / totalChunks;
  const testChunkNum = Math.floor(testAvgStartTime / timePerChunk) + 1;
  return testChunkNum === currentChunkNum;
}

export function saveTestExecutionTimeToDB(timings: Record<string, number>) {
  if (!process.env.SLOBS_TEST_RUN_CHUNK) {
    // don't save timings for tests that are not sliced
    return;
  }
  try {
    return requestUtilsServer('testTimings', 'post', timings);
  } catch (e) {
    console.error('Failed to send timings');
  }
}

export function requestUtilsServer(path: string, method = 'get', body?: unknown) {
  return new Promise((resolve, reject) => {
    fetch(`${USER_POOL_URL}/${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${USER_POOL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res: any) => {
        if (res.status !== 200) {
          res.json().then((data: any) => {
            console.error('Unable to request the utility server', data);
            reject();
          });
        } else {
          res.json().then((data: any) => resolve(data));
        }
      })
      .catch((e: any) => reject(`Utility server is not available ${e}`));
  });
}