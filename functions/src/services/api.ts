import axios from 'axios';

export const create = () => axios.create({
  baseURL: 'https://api.futabus.vn',
  headers: {
    'X-ApiKey': '29U4pC4uR39DQ4Ue0798I3YeTMZCLAnf',
  },
});
