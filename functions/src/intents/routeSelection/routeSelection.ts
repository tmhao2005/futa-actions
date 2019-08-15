import { TimeModel } from './../../models/time';
import { queryTimeTable, querySeats } from './../../services/query';
import { DialogflowConversation, DateTime, Confirmation, List, Carousel } from 'actions-on-google';
import * as moment from 'moment';
import { App, BaseIntent } from '../baseIntent';
import { queryRoute } from '../../services/query';
import { RouteModel } from '../../models/route';
import { safeInvoke } from '../../helpers';

const ROUTE_CONTEXT = 'route_context';
const ROUTE_SELECTED_CONTEXT = 'route_selected';

const HOUR_FORMAT = 'HH:mm';

interface DateTimeParams {
  date?: Date;
  time?: string;
  dateTime?: Record<'date_time', Date>;
}

type SelectedRouteParams = {
  route: RouteModel;
  departDate: Date;
  suggestions: TimeModel[];
} & DateTimeParams;

type RouteParams = {
  cityShortName: string[];
} & DateTimeParams;

export class RouteSelection extends BaseIntent {
  constructor(
    app: App,
  ) {
    super(app);
  }

  onIntent() {
    this.app.intent('ask_route', this.ask4Route);
    this.app.intent('ask_date_time', this.ask4DateTime);

    this.app.intent('ask_confirm_route', safeInvoke(this.confirmInfo));

    this.app.intent('ask_route_cancel', (conv) => {
      conv.contexts.delete('route_context');
      conv.ask('We canceled your search input');
    });

    this.app.intent('show_time_table', this.showTimeTable);

    this.app.intent('select_option', safeInvoke(this.handleSelectedTime));
  }

  private handleSelectedTime = async (conv, params, option: string) => {
    try {
      const selectedContext = conv.contexts.get(ROUTE_SELECTED_CONTEXT);
      const { route, departDate, suggestions } = selectedContext.parameters as SelectedRouteParams;

      const time = suggestions.find(item => item.id === Number(option));

      if (!time) {
        conv.ask(`Your selected time not found`);
        return;
      }

      const seats = await querySeats(route.id, time.id, departDate, time.time, time.kind);
      const free = seats.filter(item => !item.isBooked);

      if (free.length < 1) {
        conv.ask('No available seats found');
        return;
      }

      conv.ask('Here the list of seats');
      conv.ask(new List({
        title: 'Available seats',
        items: seats.reduce<any>((obj, current) => {
          obj[current.id] = {
            title: current.chair,
            description: `${current.chair} - ${current.floor}`,
          };

          return obj;
        }, {}),
      }));

    } catch (e) {
      conv.ask(`We found error ${e.message}`);
    }
  }

  private confirmInfo = async (conv: DialogflowConversation, params: any, confirmed: boolean) => {
    if (!confirmed) {
      conv.contexts.delete(ROUTE_CONTEXT);
      conv.ask('We canceled your search input');
    } else {
      try {
        const context = conv.contexts.get(ROUTE_CONTEXT);
        const { cityShortName: [d1, d2], time, dateTime: { date_time: departDate } } = context.parameters as RouteParams;
        const route = await queryRoute(d1, d2, departDate);

        // store to context
        conv.ask(`We found a route with price ${new Intl.NumberFormat('vi', { style: 'currency', currency: 'VND' }).format(route.price)}`);
        conv.contexts.set(ROUTE_SELECTED_CONTEXT, 5, {
          route,
          departDate,
        });

        conv.ask('Do you want to show list time?');
      }
      catch (e) {
        conv.ask(`We can't find your route. Please try again`);
      }
    }
  }

  private showTimeTable = async (conv: DialogflowConversation) => {
    try {
      const selectedContext = conv.contexts.get(ROUTE_SELECTED_CONTEXT);
      const { route, departDate } = selectedContext.parameters as SelectedRouteParams;
      const list = await queryTimeTable(route.id, departDate);

      const selectedHour = moment(departDate).format(HOUR_FORMAT);
      const suggestions = getSuggestedHours(list, selectedHour);

      if (suggestions.length < 1) {
        conv.ask(`Couldn't find route for ${selectedHour}`)
        return;
      }

      conv.contexts.set(ROUTE_SELECTED_CONTEXT, 5, {
        route,
        departDate,
        suggestions,
      });

      // const result = suggestions.reduce<any>((obj, current) => {
      //   obj[current.id] = {
      //     title: current.time,
      //     description: 'Just the description',
      //   };

      //   return obj;
      // }, {});

      const result = {
        [suggestions[0].id]: {
          title: suggestions[0].time,
          description: 'Just tell me',
        },
      };

      // suggestions.forEach(item => {
      //   result[item.id] = {
      //     title: item.time,
      //     description: 'Just tell me',
      //   };
      // });

      console.log(suggestions);

      conv.ask(`We recieved your route. Here the list of time: ${suggestions.map(item => item.time).join(',')}`);
      // conv.ask(new List({
      //   title: 'Suggested times',
      //   items: result
      // }));
    }
    catch (e) {
      conv.ask(`While fetching time table, we ran into error ${e.message}`);
    }
  }

  private ask4Route = (conv: DialogflowConversation) => {
    try {
      const [d1, d2] = conv.parameters.cityShortName as string[];

      conv.ask(`Your route is set from ${d1} to ${d2}`);
      conv.ask('When are you going to leave?');
    }
    catch (e) {
      conv.ask(`ASK_4_ROUTE // ${e.message}`);
    }
  }

  private ask4DateTime = (conv: DialogflowConversation) => {
    conv.ask(new Confirmation('Can you confirm your info?'));
  }
}

const getDepartTime = ({ date, time, dateTime }: DateTimeParams) => {
  if (dateTime) {
    return moment(dateTime.date_time);
  }

  if (time && date) {
    return moment(`${moment(date).format('DD/MM/YY')} ${/^.+(pm|am)$/i.test(time) ? time : time + 'am'}`, 'DD/MM/YY h:mmA');
  }
  return null;
}

const getSuggestedHours = (range: TimeModel[], anchor: string) => {
  const RADIUS_MINUTES = 120;

  const mAnchor = moment(anchor, HOUR_FORMAT);
  const d1 = mAnchor.clone().add(-RADIUS_MINUTES, 'minutes');
  const d2 = mAnchor.clone().add(RADIUS_MINUTES, 'minutes');

  const suggestedHours: TimeModel[] = [];

  range.forEach((model) => {
    const mHour = moment(model.time, HOUR_FORMAT);

    if (mHour.isBetween(d1, d2)) {
      suggestedHours.push(model);
    }
  });

  return suggestedHours;
}
