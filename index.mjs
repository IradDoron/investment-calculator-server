import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import yahooFinance from 'yahoo-finance';

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
		const currentDate = new Date();
		const dateYearsAgo = new Date(currentDate);
		dateYearsAgo.setDate(currentDate.getDate() - yearsAgo * 365.25);

		const historicalDividendsOptions = {
			symbol: ticket,
			from: dateYearsAgo,
			to: currentDate,
			period: 'v',
		};

		const historicalOptionsDayly = {
			symbol: ticket,
			from: dateYearsAgo,
			to: currentDate,
			period: 'd', // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
		};

		const quotesDayly = await yahooFinance.historical(historicalOptionsDayly);

		const dividendsQuotes = await yahooFinance.historical(
			historicalDividendsOptions
		);

		// console.log('dividendsQuotes', dividendsQuotes);

		const pricesDict = (dividends, dailyQuotes, monthlyContribution) => {
			const dictOfClosePricesOnDividendDates = {};
			let dividendIndex = dividends.length - 1;

			let currMonth = dailyQuotes[dailyQuotes.length - 1].date.getMonth();

			let stockCntr = 0;
			let contCntr = 0;
			const stockPrices = [];

			for (let i = dailyQuotes.length - 1; i >= 0; i--) {
				const { date, close } = dailyQuotes[i];

				const { date: dividendDate } = dividends[dividendIndex];

				if (date.getMonth() !== currMonth || i === dailyQuotes.length - 1) {
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
					if (dividendIndex === 0) {
						break;
					} else {
						dividendIndex--;
					}
				}
			}

			stockPrices.forEach((_, index, arr) => {
				arr[index].nextDate = arr[index + 1]?.date;
			});

			return { dictOfClosePricesOnDividendDates, stockPrices };
		};

		const divCalc = (
			dividends,
			stockPrices,
			quotesDayly,
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

				const isDateInRange = (date, start, end) => {
					return date >= start && date <= end;
				};

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

		const { dictOfClosePricesOnDividendDates, stockPrices } = pricesDict(
			dividendsQuotes,
			quotesDayly,
			monthlyContribution
		);

		const { earningsFromDividendPerYear, dividendYieldPerYear } = divCalc(
			dividendsQuotes,
			stockPrices,
			quotesDayly,
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
		};

		res.send(responseObject);
	} catch (err) {
		console.log(err);
	}
});

app.listen(PORT, HOST, () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
});
