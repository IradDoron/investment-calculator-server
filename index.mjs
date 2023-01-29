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

		const historicalOptions = {
			symbol: ticket,
			from: dateYearsAgo,
			to: currentDate,
			period: 'm', // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
		};

		const quotes = await yahooFinance.historical(historicalOptions);

		const dateAndClosedTuples = quotes.map((quote) => {
			const date = quote.date;
			const close = quote.close;
			return { date, close };
		});

		const historicalDividendsOptions = {
			symbol: ticket,
			from: dateYearsAgo,
			to: currentDate,
			period: 'v',
		};

		const dividentsQuotes = await yahooFinance.historical(
			historicalDividendsOptions
		);

		const reversedDividentsQuotes = dividentsQuotes.reverse();

		const dateAndDividendTuples = quotes.map((quote) => {
			const date = quote.date;
			const dividend = quote.dividends;
			return { date, dividend };
		});

		let shareCntr = 0;
		let contCntr = 0;
		const valueGraph = [];

		for (let i = dateAndClosedTuples.length - 1; i >= 0; i--) {
			const { date, close } = dateAndClosedTuples[i];
			shareCntr += monthlyContribution / close;
			contCntr += monthlyContribution;
			valueGraph.push({
				date,
				value: shareCntr * close,
				contribution: contCntr,
				shares: shareCntr,
				nextDate: dateAndClosedTuples[i - 1]?.date,
			});
		}

		const getSumEarningsFromDividendPerYear = (dividends, valueGraph) => {
			// valueGraph {
			// 	date: 1985-01-01T05:00:00.000Z,
			// 	value: 1000,
			// 	contribution: 1000,
			// 	shares: 1560.9756097560976,
			// 	nextDate: 1985-02-01T05:00:00.000Z
			//   }

			// dividentsQuotes { date: 2022-11-04T04:00:00.000Z, dividends: 0.365, symbol: 'INTC' }

			/*
				output:
					{
						2020: 1450, 
						2021: 1450,
						2022: 1450,
					}
			*/
			const sumEarningsFromDividendPerYear = {};
			let valueGraphIndex = 0;
			dividends.forEach((dividend) => {
				const { date: dividendDate, dividends } = dividend;
				const year = dividendDate.getFullYear();

				if (!sumEarningsFromDividendPerYear[year]) {
					sumEarningsFromDividendPerYear[year] = 0;
				}

				const isDateInRange = (date, start, end) => {
					return date >= start && date <= end;
				};

				for (let i = valueGraphIndex; i < valueGraph.length; i++) {
					const { date, nextDate, shares } = valueGraph[i];

					if (isDateInRange(dividendDate, date, nextDate)) {
						sumEarningsFromDividendPerYear[year] += shares * dividends;
						valueGraphIndex = i;
						break;
					}
				}
			});

			return sumEarningsFromDividendPerYear;
		};

		const sumEarningsFromDividendPerYear = getSumEarningsFromDividendPerYear(
			reversedDividentsQuotes,
			valueGraph
		);

		res.send(valueGraph);
	} catch (err) {
		console.log(err);
	}
});

// 	const { yearsAgo, ticket, startInvest, monthlyContribution } = req.body;
// 	console.log(yearsAgo, ticket, startInvest, monthlyContribution);
// 	valueCalc(yearsAgo, ticket, startInvest, monthlyContribution).then(
// 		(valueGraph) => {
// 			console.log('valueGraph', valueGraph);
// 			res.send(valueGraph);
// 		}
// 	);
// });

// const yearsAgo = 40;
// const ticket = 'INTC';
// const startInvest = 0;
// const monthlyContribution = 1000;

// valueCalc(yearsAgo, ticket, startInvest, monthlyContribution);

app.listen(PORT, HOST, () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
});
