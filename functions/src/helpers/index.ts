import { DialogflowConversation } from 'actions-on-google';

type Handler<T = any> = (conv: DialogflowConversation, params?: any, option?: T) => Promise<any>;

export const safeInvoke = <T = any>(fn: Handler<T>) => {
  return (async (conv, params, option) => {
    let invoked: boolean = false;

    const result = await new Promise<boolean>((resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);

        if (!invoked) {
          console.log('>>> TIME_OUT reached')
        }

        resolve(invoked);
      }, 4000);

      fn(conv, params, option).then(() => {
        invoked = true;

        resolve(true);
      });
    });

    if (!result) {
      // Fallback call
      conv.ask(`Sorry, we have to try again due to having yet completed the task`);
    }
  }) as Handler;
};