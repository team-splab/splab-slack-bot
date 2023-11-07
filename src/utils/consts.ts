export const TEST_CHANNEL_ID = 'C0502Q0S05P';
export const MENU_CHANNEL_ID = 'C051U09FMBK';

export const DAYS_KOREAN = ['일', '월', '화', '수', '목', '금', '토'];

export const ACTIONS = {
  MENU_SELECT: 'menu_select',
};

export const SLASH_COMMANDS = {
  DAILY_REPORT: command('daily_report'),
  UMOH: command('umoh'),
};

function command(command: string) {
  return `/${process.env.IS_PRODUCTION === 'true' ? '' : 'dev_'}${command}`;
}
