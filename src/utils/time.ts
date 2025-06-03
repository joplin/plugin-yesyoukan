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

export function msleep(ms: number) {
	// It seems setTimeout can sometimes last less time than the provided
	// interval:
	//
	// https://stackoverflow.com/a/50912029/561309
	//
	// This can cause issues in tests where we expect the actual duration to be
	// the same as the provided interval or more, but not less. So the code
	// below check that the elapsed time is no less than the provided interval,
	// and if it is, it waits a bit longer.
	const startTime = Date.now();
	return new Promise((resolve) => {
		setTimeout(() => {
			if (Date.now() - startTime < ms) {
				const iid = setInterval(() => {
					if (Date.now() - startTime >= ms) {
						clearInterval(iid);
						resolve(null);
					}
				}, 2);
			} else {
				resolve(null);
			}
		}, ms);
	});
}

export const formatDateTime = (ms:number, timeFormat:string) => {
	return dayjs(new Date(ms)).format(timeFormat);
}