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

		const getDictOfClosePricesOnDividendDatesAndValueGraph = (
			dividends,
			dailyQuotes,
			monthlyContribution
		) => {
			const dictOfClosePricesOnDividendDates = {};
			let dividendIndex = dividends.length - 1;

			let currMonth = dailyQuotes[dailyQuotes.length - 1].date.getMonth();

			let shareCntr = 0;
			let contCntr = 0;
			const valueGraph = [];

			for (let i = dailyQuotes.length - 1; i >= 0; i--) {
				const { date, close } = dailyQuotes[i];

				const { date: dividendDate } = dividends[dividendIndex];

				if (date.getMonth() !== currMonth || i === dailyQuotes.length - 1) {
					shareCntr += monthlyContribution / close;
					contCntr += monthlyContribution;
					valueGraph.push({
						date,
						value: shareCntr * close,
						contribution: contCntr,
						shares: shareCntr,
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

			valueGraph.forEach((_, index, arr) => {
				arr[index].nextDate = arr[index + 1]?.date;
			});

			console.log('valueGraph', valueGraph);

			return { dictOfClosePricesOnDividendDates, valueGraph };
		};

		const getSumEarningsFromDividendPerYear = (
			dividends,
			valueGraph,
			quotesDayly,
			dictOfClosePricesOnDividendDates
		) => {
			const sumEarningsFromDividendPerYear = {};
			const dividendYieldPerYear = {};
			let valueGraphIndex = 0;
			for (let i = dividends.length - 1; i >= 0; i--) {
				const { date: dividendDate, dividends: currDividends } = dividends[i];
				const year = dividendDate.getFullYear();

				if (!sumEarningsFromDividendPerYear[year]) {
					sumEarningsFromDividendPerYear[year] = 0;
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

				for (let i = valueGraphIndex; i < valueGraph.length; i++) {
					const { date, nextDate, shares } = valueGraph[i];

					if (isDateInRange(dividendDate, date, nextDate)) {
						sumEarningsFromDividendPerYear[year] += shares * currDividends;
						valueGraphIndex = i;
						break;
					}
				}
			}

			return sumEarningsFromDividendPerYear;
		};

		const dictOfClosePricesOnDividendDatesAndValueGraph =
			getDictOfClosePricesOnDividendDatesAndValueGraph(
				dividendsQuotes,
				quotesDayly,
				monthlyContribution
			);

		const { dictOfClosePricesOnDividendDates, valueGraph } =
			dictOfClosePricesOnDividendDatesAndValueGraph;

		const sumEarningsFromDividendPerYear = getSumEarningsFromDividendPerYear(
			dividendsQuotes,
			valueGraph,
			quotesDayly,
			dictOfClosePricesOnDividendDates
		);

		res.send(valueGraph);
	} catch (err) {
		console.log(err);
	}
});

app.listen(PORT, HOST, () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
});
