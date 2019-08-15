import { App } from './baseIntent';
import { RouteSelection } from './routeSelection/routeSelection';

export class RootIntent {

  constructor(
    private app: App,
  ) {

    this.registerAllIntents();
  }

  private registerAllIntents(): void {
    [
      new RouteSelection(this.app),
    ].forEach(
      instance => instance.onIntent(),
    );
  }
}
