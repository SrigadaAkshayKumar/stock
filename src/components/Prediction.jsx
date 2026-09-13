import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import { ClipLoader } from "react-spinners";
import PredictionMetrics from "./PredictionMetrics";
import EvaluationChart from "./EvaluationChart";

function Prediction({ ticker }) {
  const [predictedData, setPredictedData] = useState([]);
  const [predictedDates, setPredictedDates] = useState([]);

  const [actualData, setActualData] = useState([]);
  const [actualDates, setActualDates] = useState([]);

  const [returns, setReturns] = useState([]);

  const [evaluation, setEvaluation] = useState(null);

  const [evaluationChart, setEvaluationChart] = useState({
    actual: [],
    predicted: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPredictionData = useCallback(async () => {
    if (!ticker) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const baseUrl =
        process.env.REACT_APP_API_URL ||
        "http://127.0.0.1:10000";

      const response = await axios.get(
        `${baseUrl}/api/stock/${ticker}/predict?refresh=true`
      );

      const data = response.data;

      console.log("Full API Response:", data);
      console.log("Evaluation:", data.evaluation);
      console.log("Evaluation Chart:", data.evaluation_chart);

      setPredictedData(
        data.predictions || []
      );

      setPredictedDates(
        data.predicted_dates || []
      );

      setActualData(
        data.actual || []
      );

      setActualDates(
        data.actual_dates || []
      );

      setReturns(
        data.returns || []
      );

      setEvaluation(
        data.evaluation ||
        data.metrics ||
        null
      );

      setEvaluationChart(
        data.evaluation_chart || {
          actual: data.test_actual || [],
          predicted: data.test_predicted || [],
        }
      );
    } catch (err) {
      console.error(
        "Error fetching prediction data:",
        err
      );

      setError(
        err.response?.data?.error ||
        "Unable to load prediction data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    if (ticker) {
      fetchPredictionData();
    }
  }, [ticker, fetchPredictionData]);

  return (
    <div className="predict">
      <div className="predict12">

        {isLoading ? (
          <div className="loading-spinner">

            <ClipLoader
              color="#36d7b7"
              size={50}
            />

            <p>
              Loading prediction data...
            </p>

          </div>
        ) : error ? (
          <div className="prediction-error">

            <h3>
              Unable to Load Prediction
            </h3>

            <p>
              {error}
            </p>

          </div>
        ) : (
          <>

            {/* Historical + Future Prediction Chart */}
            <div className="predict1">

              <h2>
                Predicted vs Actual Stock Prices for{" "}
                {ticker}
              </h2>

              <Plot
                data={[
                  {
                    x: actualDates,
                    y: actualData,
                    type: "scatter",
                    mode: "lines",
                    name: "Actual Price",

                    line: {
                      color: "green",
                      width: 2,
                    },
                  },

                  {
                    x: predictedDates,
                    y: predictedData,
                    type: "scatter",
                    mode: "lines+markers",
                    name: "Future Prediction",

                    line: {
                      color: "red",
                      width: 2,
                    },
                  },
                ]}

                layout={{
                  title:
                    `Historical and Predicted Prices for ${ticker}`,

                  autosize: true,

                  xaxis: {
                    title: {
                      text: "Date",

                      font: {
                        family: "Arial",
                        size: 14,
                      },
                    },
                  },

                  yaxis: {
                    title: {
                      text: "Stock Price",

                      font: {
                        family: "Arial",
                        size: 14,
                      },
                    },
                  },

                  legend: {
                    orientation: "h",
                    x: 0.5,
                    xanchor: "center",
                    y: -0.2,
                  },

                  margin: {
                    t: 60,
                    r: 30,
                    b: 90,
                    l: 70,
                  },
                }}

                config={{
                  responsive: true,
                  displaylogo: false,
                }}

                useResizeHandler={true}

                style={{
                  width: "100%",
                  height: "100%",
                }}
              />

            </div>


            {/* Model Evaluation Metrics */}
            <PredictionMetrics
              evaluation={evaluation}
            />


            {/* Actual vs Predicted Evaluation Chart */}
            <EvaluationChart
              chartData={evaluationChart}
            />


            {/* Investment Returns */}
            <div className="predict2">

              <h2>
                Investment Returns
              </h2>

              <table border="1">

                <thead>
                  <tr>

                    <th>
                      Stocks Bought
                    </th>

                    <th>
                      Current Price
                    </th>

                    <th>
                      After 1 Year
                    </th>

                    <th>
                      After 5 Years
                    </th>

                    <th>
                      After 10 Years
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {returns.length > 0 ? (

                    returns.map(
                      (item, index) => (

                        <tr key={index}>

                          <td>
                            {item.stocks_bought}
                          </td>

                          <td>
                            {item.current_price}
                          </td>

                          <td>
                            {item.after_1_year}
                          </td>

                          <td>
                            {item.after_5_years}
                          </td>

                          <td>
                            {item.after_10_years}
                          </td>

                        </tr>

                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="5"
                        style={{
                          textAlign: "center",
                        }}
                      >
                        No return data available
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </>
        )}

      </div>
    </div>
  );
}

export default Prediction;