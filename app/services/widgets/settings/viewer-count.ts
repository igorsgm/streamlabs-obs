import {
  IWidgetData,
  IWidgetSettings,
  WidgetDefinitions,
  WidgetSettingsService,
  WidgetType,
} from 'services/widgets';
import { WIDGET_INITIAL_STATE } from './widget-settings';
import { InheritMutations } from 'services/core/stateful-service';

interface IViewerCountSettings extends IWidgetSettings {
  background_color: string;
  font: string;
  font_color: string;
  font_size: string;
  font_weight: number;
  twitch: boolean;
  youtube: boolean;
  facebook: boolean;
}

export interface IViewerCountData extends IWidgetData {
  settings: IViewerCountSettings;
}

@InheritMutations()
export class ViewerCountService extends WidgetSettingsService<IViewerCountData> {
  static initialState = WIDGET_INITIAL_STATE;

  getApiSettings() {
    return {
      type: WidgetType.ViewerCount,
      url: WidgetDefinitions[WidgetType.ViewerCount].url(this.getHost(), this.getWidgetToken()),
      previewUrl: `http://${this.getHost()}/widgets/viewer-count?token=${this.getWidgetToken()}&simulate=1`,
      dataFetchUrl: `http://${this.getHost()}/api/v5/slobs/widget/viewercount`,
      settingsSaveUrl: `http://${this.getHost()}/api/v5/slobs/widget/viewercount`,
      settingsUpdateEvent: 'viewerCountSettingsUpdate',
      customCodeAllowed: true,
      customFieldsAllowed: true,
    };
  }

  patchAfterFetch(data: any): IViewerCountData {
    // transform platform types to simple booleans
    return {
      ...data,
      settings: {
        ...data.settings,
        twitch: data.settings.types.twitch.enabled,
        youtube: data.settings.types.youtube.enabled,
        facebook: data.settings.types.facebook.enabled,
      },
    };
  }

  patchBeforeSend(settings: IViewerCountSettings): any {
    // the API accepts an object instead of simple booleans for platforms
    return {
      ...settings,
      types: {
        youtube: { enabled: settings.youtube },
        twitch: { enabled: settings.twitch },
        facebook: { enabled: settings.facebook },
      },
    };
  }
}
