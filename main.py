from yahoo_fin.stock_info import get_data, get_dividends, get_quote_data
import datetime
import sys
import json
# import pandas as pd
# from matplotlib import pyplot as plt


def find_next_month_ind(days_list):
    for day_ind, day in enumerate(days_list):
        if day.month != days_list[0].month:
            return day_ind
    return -1


class GraphValues:
    def __init__(self, total_value, total_contribution, dividend=None):
        self.total_value = total_value
        self.total_contribution = total_contribution
        self.dividend = dividend


def parse_data(ticket, years_ago):
    df_value = get_data(ticket, start_date=str((datetime.datetime.now() - datetime.timedelta(days=years_ago*365)).date()),
                        end_date=None, interval="1d")
    df_div = get_dividends(ticket, start_date=str((datetime.datetime.now() - datetime.timedelta(days=years_ago*365)).date()),
                           end_date=None)
    comp_info = get_quote_data(ticker=ticket)
    if not df_div.empty:
        df_div = df_div['dividend']
    day_of_invest_list = []
    temp_date_of_div = df_div.index.tolist()
    date_for_div_list = []
    ind = 0
    days_list = df_value.index.tolist()
    while ind < len(days_list)-1:
        if days_list[ind].day < 10:
            ind += 1
            continue
        if days_list[ind].day >= 10:
            if temp_date_of_div:
                if days_list[ind].date() > temp_date_of_div[0]:
                    if day_of_invest_list:
                        date_for_div_list.append(
                            str(days_list[day_of_invest_list[-1]].date()))
                        temp_date_of_div.pop(0)
                    else:
                        temp_date_of_div.pop(0)
            day_of_invest_list.append(ind)
            next_month_ind = find_next_month_ind(days_list[ind:ind+24])
            if next_month_ind == -1:
                break
            else:
                ind += next_month_ind
    return df_value.iloc[day_of_invest_list]['close'], df_div, date_for_div_list, comp_info


def value_and_div_calc(df_of_price, df_div, date_for_div_list, start_invest, monthly_contribution):
    total_contribution = start_invest
    cnt_of_share = start_invest/df_of_price[0]
    graph_dict = dict()
    div_cnt = 0
    div_graph_dict = dict()
    value_end_year = dict()

    for date, price in df_of_price.iteritems():
        cnt_of_share += monthly_contribution/price
        total_contribution += monthly_contribution
        if str(date.date()) in date_for_div_list:
            div_cnt += cnt_of_share * \
                df_div.iloc[date_for_div_list.index(str(date.date()))]
            if date.year in div_graph_dict.keys():
                div_graph_dict[date.year] += cnt_of_share * \
                    df_div.iloc[date_for_div_list.index(str(date.date()))]
            else:
                div_graph_dict[date.year] = cnt_of_share * \
                    df_div.iloc[date_for_div_list.index(str(date.date()))]
        graph_dict[str(date.date())] = GraphValues(
            cnt_of_share*price, total_contribution, dividend=div_cnt)
        if date.month == 12:
            value_end_year[date.year] = graph_dict[str(
                date.date())].total_value
    return graph_dict, div_graph_dict, div_cnt, total_contribution, cnt_of_share, value_end_year


def value_cal(years_ago, ticket, start_invest, monthly_contribution):

    df_of_price, df_div, date_for_div_list, comp_info = parse_data(
        ticket, years_ago)

    graph_dict, div_graph_dict, div_cnt, total_contribution, cnt_of_share, value_end_year = value_and_div_calc(
        df_of_price, df_div, date_for_div_list, start_invest, monthly_contribution)

    div_year_yield = {
        key: value*100/value_end_year[key] for key, value in div_graph_dict.items()}

    graph_dict_json = json.dumps(
        graph_dict, default=lambda o: o.__dict__, indent=4)

    div_graph_dict_json = json.dumps(div_graph_dict, indent=4)

    div_year_yield_json = json.dumps(div_year_yield, indent=4)

    seperator = "&*&"

    print(graph_dict_json)
    print(seperator)
    print(div_graph_dict_json)
    print(seperator)
    print(div_year_yield_json)

    # print(json_obj)
    # ax1 = plt.subplot2grid((1, 2), (0, 0), colspan=1)
    # ax1.plot(df_of_price.index, [
    #          elem.total_contribution for elem in graph_dict.values()], label="Total Contribution")
    # ax1.plot(df_of_price.index, [
    #          elem.total_value for elem in graph_dict.values()], label="Total Value")
    # ax1.plot(df_of_price.index, [
    #          elem.total_value - elem.total_contribution for elem in graph_dict.values()], label="Total Profit")
    # ax1.legend(loc="upper left", frameon=False)
    # ax2 = plt.subplot2grid((1, 2), (0, 1), rowspan=1)
    # years_list = set(date.year for date in df_of_price.index)
    # ax2.step(list(div_graph_dict.keys())[
    #          :-1], list(div_graph_dict.values())[:-1], label="Dividend per Year")
    # ax2.legend(loc="upper left", frameon=False)
    # ax2.set_ylabel('USD')
    # ax2_ = ax2.twinx()
    # ax2_.step(list(div_graph_dict.keys())[:-1], list(div_year_yield.values())[
    #           :-1], label="Dividend Yield per Year [%]", color="red")
    # ax2_.set_ylabel('[%]', color="red")
    # ax2_.legend(loc="upper right", frameon=False)
    # plt.suptitle(f"{comp_info['longName']} \n")
    # plt.show()


if __name__ == '__main__':

    # value_cal(years_ago=40, ticket='INTC',
    #           start_invest=0, monthly_contribution=1000)

    value_cal(years_ago=float(sys.argv[1]), ticket=sys.argv[2],
              start_invest=float(sys.argv[3]), monthly_contribution=float(sys.argv[4]))
