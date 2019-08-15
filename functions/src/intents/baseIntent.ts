import { dialogflow } from 'actions-on-google';

export type App = ReturnType<typeof dialogflow>;

export abstract class BaseIntent {
  constructor(
    protected app: ReturnType<typeof dialogflow>,
  ) {}

  protected abstract onIntent();
}
