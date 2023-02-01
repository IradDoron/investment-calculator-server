import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import yahooFinance from 'yahoo-finance2';

import { divCalc, pricesDict } from './helpers/index.mjs';

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

		const { dividends } = quotesDayly.events;
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
			stockFullName: result.price.longName,
		};

		res.send(responseObject);
	} catch (err) {
		console.log(err);
	}
});

app.listen(PORT, HOST, () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
});
