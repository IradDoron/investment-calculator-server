import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import yahooFinance from 'yahoo-finance2';

config();

const app = express();

app.use(express.json());

app.use(cors());

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.post('/calc', async (req, res) => {
	try {
		const { yearsAgo, ticket, startInvest, monthlyContribution } = req.body;
		const queryOptions = { modules: ['price'] }; // defaults
		const result = await yahooFinance.quoteSummary(ticket, queryOptions);
		const currentDate = new Date();
		const dateYearsAgo = new Date(currentDate);
		dateYearsAgo.setDate(currentDate.getDate() - yearsAgo * 365.25);

		const historicalOptionsDayly = {
			period1: dateYearsAgo,
			period2: currentDate,
			interval: '1d',
		};

		const quotesDayly = await yahooFinance._chart(
			ticket,
			historicalOptionsDayly
		);

		if (quotesDayly.length === 0) {
			res.send({ error: 'No data for this ticker' });
			return;
		}

		let dividends = null;
		if (quotesDayly.events?.dividends) {
			dividends = quotesDayly.events?.dividends;
		}

		const { quotes } = quotesDayly;

		const { dictOfClosePricesOnDividendDates, stockPrices } = pricesDict(
			quotes,
			dividends,
			monthlyContribution
		);

		const { earningsFromDividendPerYear, dividendYieldPerYear } = divCalc(
			dividends,
			stockPrices,
			dictOfClosePricesOnDividendDates
		);

		const earningsFromDividendPerYearArr = Object.entries(
			earningsFromDividendPerYear
		).map(([year, value]) => ({
			year,
			value,
		}));

		const dividendYieldPerYearArr = Object.entries(dividendYieldPerYear).map(
			([year, value]) => ({
				year,
				value,
			})
		);

		const responseObject = {
			stockPrices,
			earningsFromDividendPerYear: earningsFromDividendPerYearArr,
			dividendYieldPerYear: dividendYieldPerYearArr,
			stockFullName: result.price.longName
				? result.price.longName
				: result.price.shortName,
		};

		res.send(responseObject);
	} catch (err) {
		console.log(err);
	}
});

app.listen(PORT, HOST, () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
});

export const divCalc = (
	dividends,
	stockPrices,
	dictOfClosePricesOnDividendDates
) => {
	const earningsFromDividendPerYear = {};
	const dividendYieldPerYear = {};

	if (!dividends) {
		return { earningsFromDividendPerYear, dividendYieldPerYear };
	} else {
		let stockPriceIndex = 0;
		for (let i = 0; i < dividends.length; i++) {
			const { date: dividendDate, amount: currDividends } = dividends[i];
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

			for (let i = stockPriceIndex; i < stockPrices.length; i++) {
				const { date, nextDate, stockCnt } = stockPrices[i];

				if (
					isDateInRange(dividendDate, date, nextDate) ||
					(!nextDate && isDateInRange(dividendDate, date, new Date()))
				) {
					earningsFromDividendPerYear[year] += stockCnt * currDividends;
					stockPriceIndex = i;
					break;
				}
			}
		}
	}

	return { earningsFromDividendPerYear, dividendYieldPerYear };
};

export const isDateInRange = (date, start, end) => {
	return date >= start && date <= end;
};

export const pricesDict = (quotes, dividends, monthlyContribution) => {
	const dictOfClosePricesOnDividendDates = {};
	let dividendIndex = 0;
	let currMonth = quotes[0].date.getMonth();
	let stockCntr = 0;
	let contCntr = 0;
	const stockPrices = [];

	if (!dividends) {
		quotes.forEach((element, index) => {
			const { date, close } = element;

			if (date.getMonth() !== currMonth || index === 0) {
				stockCntr += monthlyContribution / close;
				contCntr += monthlyContribution;
				stockPrices.push({
					date,
					value: stockCntr * close,
					contribution: contCntr,
					stockCnt: stockCntr,
				});

				currMonth = date.getMonth();
			}
		});

		stockPrices.forEach((_, index, arr) => {
			arr[index].nextDate = arr[index + 1]?.date;
		});

		return { dictOfClosePricesOnDividendDates, stockPrices };
	} else {
		for (let i = 0; i < quotes.length; i++) {
			const { date, close } = quotes[i];

			const { date: dividendDate } = dividends[dividendIndex];

			if (date.getMonth() !== currMonth || i === 0) {
				stockCntr += monthlyContribution / close;
				contCntr += monthlyContribution;
				stockPrices.push({
					date,
					value: stockCntr * close,
					contribution: contCntr,
					stockCnt: stockCntr,
				});

				currMonth = date.getMonth();
			}

			if (date.getTime() === dividendDate.getTime()) {
				dictOfClosePricesOnDividendDates[date.getTime()] = close;
				if (dividendIndex === dividends.length - 1) {
					break;
				} else {
					dividendIndex++;
				}
			}
		}

		stockPrices.forEach((_, index, arr) => {
			arr[index].nextDate = arr[index + 1]?.date;
		});

		return { dictOfClosePricesOnDividendDates, stockPrices };
	}
};
