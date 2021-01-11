import { GenericGoalService } from './generic-goal';
import { WidgetDefinitions, WidgetType } from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

@InheritMutations()
export class BitGoalService extends GenericGoalService {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.BitGoal,
      url: WidgetDefinitions[WidgetType.BitGoal].url(this.getHost(), this.getWidgetToken()),
      dataFetchUrl: `http://${this.getHost()}/api/v5/slobs/widget/bitgoal/settings`,
      previewUrl: `http://${this.getHost()}/widgets/bit-goal?token=${this.getWidgetToken()}`,
      settingsSaveUrl: `http://${this.getHost()}/api/v5/slobs/widget/bitgoal/settings`,
      goalUrl: `http://${this.getHost()}/api/v5/slobs/widget/bitgoal`,
      settingsUpdateEvent: 'bitGoalSettingsUpdate',
      goalCreateEvent: 'bitGoalStart',
      goalResetEvent: 'bitGoalEnd',
      hasTestButtons: true,
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }
}
