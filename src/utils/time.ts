const dayjs = require('dayjs');

export const Second = 1000;
export const Minute = 60 * Second;
export const Hour = 60 * Minute;
export const Day = 24 * Hour;
export const Week = 7 * Day;
export const Month = 30 * Day;

function initDayJs() {
	// dayjs.extend(dayJsRelativeTime);
}

initDayJs();

export const msleep = (ms: number) => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const formatDateTime = (ms:number, timeFormat:string) => {
	return dayjs(new Date(ms)).format(timeFormat);
}