// sample seat data
interface SeatData {
  BookStatus: 1,
  Chair: string;
  ColumnNo: number;
  Discount: 0
  FloorNo: 1
  Id: 115921913
  InSelect: 0
  LockChair: 0
  RowNo: 1
}

export class SeatModel {
  public id: number;
  public chair: string;
  public floor: 1 | 2;
  public isBooked: boolean;

  public raw: any;

  constructor(raw: SeatData) {
    this.raw = raw;

    this.id = raw.Id;
    this.chair = raw.Chair;
    this.floor = raw.FloorNo;
    this.isBooked = raw.BookStatus > 1;
  }
}
