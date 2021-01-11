import { GenericGoalService } from './generic-goal';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class SubscriberGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.SubscriberGoal,
      url: WidgetDefinitions[WidgetType.SubscriberGoal].url(this.getHost(), this.getWidgetToken()),
      previewUrl: `http://${this.getHost()}/widgets/follower-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `http://${this.getHost()}/api/v5/slobs/widget/followergoal/settings`,
      settingsSaveUrl: `http://${this.getHost()}/api/v5/slobs/widget/followergoal/settings`,
      goalUrl: `http://${this.getHost()}/api/v5/slobs/widget/followergoal`,
      settingsUpdateEvent: 'followerGoalSettingsUpdate',
      goalCreateEvent: 'followerGoalStart',
      goalResetEvent: 'followerGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
