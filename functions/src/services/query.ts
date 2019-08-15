import { SeatModel } from './../models/seat';
import { RouteModel } from './../models/route';
import * as moment from 'moment';
import { create } from "./api";
import { TimeModel } from '../models/time';

interface ResultData<T = any> {
  Data: T[];
  status: number;
}

interface RouteData {
  DestCode: "CANTHO"
  DestName: "Cần Thơ"
  Distance: 166961
  Duration: 12600
  Id: 370
  Name: "Sai Gon ⇒ Can Tho"
  OriginCode: "TPHCM"
  OriginName: "TP.Hồ Chí Minh"
  Price: 130000
  StribId: 4212
  TotalSchedule: 0
}

interface TimeData {
  IDKind: 403
  IDTimeStart: 653
  IDWay: 14
  Id: 2752966
  Kind: "Giường"
  Time: "00:00"
}


const api = create();

export const queryRoute = async (d1: string, d2: string, date: Date | string) => {
  const { data: { Data: [ result ] } } = await api.post<ResultData<RouteData>>('/api/queryroutewithprice', {
    DepartureDate: moment(date).format('DD-MM-YYYY'),
    DestCode: d1,
    OriginCode: d2,
    Version: 202,
  });

  return new RouteModel(result.Id, result.Price);
}

export const queryTimeTable = async (routeId: number, departureDate: Date | string) => {
  const { data: { Data: items } } = await api.post<ResultData<TimeData>>('/api/querytimetable', {
    DepartureDate: moment(departureDate).format('DD-MM-YYYY'),
    RouteId: routeId,
    Version: 202,
  });

  return items.map(item => new TimeModel(item.Id, item.Time, item.Kind));
}

export const querySeats = async (routeId: number, timeId: number, departureDate: Date | string, departureTime: string, kind: string) => {
  const { data: { Data: items } } = await api.post<ResultData>('/api/queryseat', {
    CarBookingId: timeId,
    DepartureDate: moment(departureDate).format('DD-MM-YYYY'),
    DepartureTime: departureTime,
    Kind: kind,
    RouteId: routeId,
    Version: 202
  });

  return items.map(item => new SeatModel(item));
}
