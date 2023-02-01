import { isDateInRange } from './isDateInRange.mjs';

export const divCalc = (
	dividends,
	stockPrices,
	dictOfClosePricesOnDividendDates
) => {
	const earningsFromDividendPerYear = {};
	const dividendYieldPerYear = {};
	let valueGraphIndex = 0;
	for (let i = dividends.length - 1; i >= 0; i--) {
		const { date: dividendDate, dividends: currDividends } = dividends[i];
		const year = dividendDate.getFullYear();

		if (!earningsFromDividendPerYear[year]) {
			earningsFromDividendPerYear[year] = 0;
		}

		if (!dividendYieldPerYear[year]) {
			dividendYieldPerYear[year] = 0;
		}

		dividendYieldPerYear[year] +=
			(currDividends /
				dictOfClosePricesOnDividendDates[dividendDate.getTime()]) *
			100;

		for (let i = valueGraphIndex; i < stockPrices.length; i++) {
			const { date, nextDate, stockCnt } = stockPrices[i];

			if (
				isDateInRange(dividendDate, date, nextDate) ||
				(!nextDate && isDateInRange(dividendDate, date, new Date()))
			) {
				earningsFromDividendPerYear[year] += stockCnt * currDividends;
				valueGraphIndex = i;
				break;
			}
		}
	}

	return { earningsFromDividendPerYear, dividendYieldPerYear };
};
