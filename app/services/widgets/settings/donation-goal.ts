import { GenericGoalService } from './generic-goal';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class DonationGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.DonationGoal,
      url: WidgetDefinitions[WidgetType.DonationGoal].url(this.getHost(), this.getWidgetToken()),
      previewUrl: `http://${this.getHost()}/widgets/donation-goal?token=${this.getWidgetToken()}`,
      dataFetchUrl: `http://${this.getHost()}/api/v5/slobs/widget/donationgoal/settings/new`,
      settingsSaveUrl: `http://${this.getHost()}/api/v5/slobs/widget/donationgoal/settings/new`,
      goalUrl: `http://${this.getHost()}/api/v5/slobs/widget/donationgoal/new`,
      settingsUpdateEvent: 'donationGoalSettingsUpdate',
      goalCreateEvent: 'donationGoalStart',
      goalResetEvent: 'donationGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
