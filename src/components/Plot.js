// Plotly's basic bundle (scatter, bar, pie) is ~1 MB smaller than the full
// plotly.js and covers every chart in the app.
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-basic-dist-min";

const Plot = createPlotlyComponent(Plotly);
export default Plot;
