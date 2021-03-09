import Vue from 'vue';
import electron from 'electron';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { getComponents, IModalOptions, IWindowOptions, WindowsService } from 'services/windows';
import { CustomizationService } from 'services/customization';
import { TitleBar } from 'components/shared/ReactComponent';
import { AppService } from 'services/app';
import styles from './ChildWindow.m.less';
import ModalWrapper from '../shared/modals/ModalWrapper';

@Component({})
export default class ChildWindow extends Vue {
  @Inject() private windowsService: WindowsService;
  @Inject() private customizationService: CustomizationService;
  @Inject() private appService: AppService;

  components: IWindowOptions[] = [];
  private refreshingTimeout: number;
  private modalOptions: IModalOptions = { renderFn: null };

  mounted() {
    WindowsService.modalChanged.subscribe(modalOptions => {
      this.modalOptions = { ...this.modalOptions, ...modalOptions };
    });
    this.onWindowUpdatedHandler(this.options);
    this.windowsService.windowUpdated.subscribe(windowInfo => {
      if (windowInfo.windowId !== 'child') return;
      this.onWindowUpdatedHandler(windowInfo.options);
    });
  }

  get options() {
    return this.windowsService.state.child;
  }

  get theme() {
    return this.customizationService.currentTheme;
  }

  get currentComponent() {
    return this.components[this.components.length - 1];
  }

  get componentsToRender() {
    return this.components.filter(c => c.componentName && !this.appLoading);
  }

  get appLoading() {
    return this.appService.state.loading;
  }

  clearComponentStack() {
    this.components = [];
  }

  private setWindowTitle() {
    electron.remote.getCurrentWindow().setTitle(this.currentComponent.title);
  }

  windowResizeTimeout: number;

  windowSizeHandler() {
    if (!this.windowsService.state.child.hideStyleBlockers) {
      this.windowsService.actions.updateStyleBlockers('child', true);
    }
    clearTimeout(this.windowResizeTimeout);

    this.windowResizeTimeout = window.setTimeout(
      () => this.windowsService.actions.updateStyleBlockers('child', false),
      200,
    );
  }

  private onWindowUpdatedHandler(options: IWindowOptions) {
    window.removeEventListener('resize', this.windowSizeHandler);
    // If the window was closed, just clear the stack
    if (!options.isShown) {
      this.clearComponentStack();
      WindowsService.hideModal();
      return;
    }

    if (options.preservePrevWindow) {
      this.handlePreservePrevWindow(options);
      return;
    }

    if (options.isPreserved) {
      this.handleIsPreservedWindow();
      return;
    }

    this.clearComponentStack();

    // This is essentially a race condition, but make a best effort
    // at having a successful paint cycle before loading a component
    // that will do a bunch of synchronous IO.
    clearTimeout(this.refreshingTimeout);
    this.refreshingTimeout = window.setTimeout(async () => {
      this.components.push({
        ...options,
        isShown: true,
      });
      this.setWindowTitle();
      window.addEventListener('resize', this.windowSizeHandler);
    }, 50);
  }

  private handlePreservePrevWindow(options: IWindowOptions) {
    this.currentComponent.isShown = false;
    this.components.push({
      ...options,
      isShown: true,
    });
    this.setWindowTitle();
    window.addEventListener('resize', this.windowSizeHandler);
  }

  private handleIsPreservedWindow() {
    this.components.pop();
    this.currentComponent.isShown = true;
    this.setWindowTitle();
    window.addEventListener('resize', this.windowSizeHandler);
  }

  render() {
    return (
      <div style="height: 100%;" class={this.theme} id="mainWrapper">
        <TitleBar componentProps={{ windowId: 'child' }} class={styles.childWindowTitlebar} />
        <div class={styles.blankSlate}>
          <div class={styles.spinnerSpacer} />
          <i class="fa fa-spinner fa-pulse" />
          <div class={styles.spinnerSpacer} />
        </div>
        <ModalWrapper renderFn={this.modalOptions?.renderFn} />

        {this.componentsToRender.map((comp, index) => {
          const ChildWindowComponent = getComponents()[comp.componentName];
          return (
            <ChildWindowComponent key={`${comp.componentName}-${index}`} vShow={comp.isShown} />
          );
        })}
      </div>
    );
  }
}
