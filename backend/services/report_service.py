"""ReportService - consolidated PDF analysis reports."""

import logging
import os
import re
from datetime import datetime, timezone
from typing import Dict, List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from xml.sax.saxutils import escape

from core.settings import settings
from repositories import get_repository

logger = logging.getLogger(__name__)


def _fmt(value, pct=False, digits=2):
    if value is None or value == "":
        return "n/a"
    if isinstance(value, (int, float)):
        return f"{value * 100:.{digits}f}%" if pct else f"{value:,.{digits}f}"
    return str(value)


def _md_to_para(text: str) -> str:
    """Escape text and convert **bold** markdown to reportlab markup."""
    text = escape(text or "")
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)


class ReportService:
    def __init__(self, reports_dir: str = None):
        self.reports_dir = reports_dir or settings.REPORTS_DIR
        os.makedirs(self.reports_dir, exist_ok=True)
        base = getSampleStyleSheet()
        self.styles = {
            "title": ParagraphStyle("t", parent=base["Title"], fontSize=20, spaceAfter=6),
            "h2": ParagraphStyle("h2", parent=base["Heading2"], textColor=colors.HexColor("#1e3a8a"), spaceBefore=10),
            "body": ParagraphStyle("b", parent=base["BodyText"], fontSize=9.5, leading=13),
            "small": ParagraphStyle("s", parent=base["BodyText"], fontSize=8, leading=10, textColor=colors.HexColor("#475569")),
        }

    def collect_analysis(self, symbol: str) -> Dict:
        from services.analysis_service import collect_analysis
        return collect_analysis(symbol, include_series=False)

    # -- building blocks ----------------------------------------------------
    def _table(self, rows: List[List], widths=None) -> Table:
        data = [[Paragraph(_md_to_para(str(c)), self.styles["body"]) for c in row] for row in rows]
        t = Table(data, colWidths=widths, hAlign="LEFT")
        t.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e1")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return t

    def _section(self, story, title, paragraphs=(), table=None):
        story.append(Paragraph(escape(title), self.styles["h2"]))
        for p in paragraphs:
            story.append(Paragraph(_md_to_para(p), self.styles["body"]))
            story.append(Spacer(1, 3))
        if table is not None:
            story.append(table)

    def build_report(self, a: Dict) -> List:
        s, story = self.styles, []
        company = a.get("company", {})
        story.append(Paragraph(escape(f"{company.get('name', a['symbol'])} ({a['symbol']}) — Stock Analysis Report"), s["title"]))
        story.append(Paragraph(escape(f"Generated {a['generated_at']} UTC · data as of {a.get('price', {}).get('as_of', 'n/a')}"), s["small"]))

        ai = a.get("ai_summary", {})
        pred = a.get("primary_prediction") or {}
        risk = a.get("risk", {})
        self._section(story, "1. Executive Summary", [
            f"Short-term outlook: **{ai.get('short_term_outlook') or 'n/a'}** over {ai.get('prediction_horizon') or 'n/a'}; "
            f"technical bias **{ai.get('technical_bias') or 'n/a'}**; news sentiment **{ai.get('news_sentiment') or 'n/a'}**; "
            f"risk level **{risk.get('risk_level') or 'n/a'}**.",
        ])

        price = a.get("price", {})
        self._section(story, "2. Current Market Data", table=self._table([
            ["Last close", "Change", "Open", "High", "Low", "Volume", "Source"],
            [_fmt(price.get("price")), f"{_fmt(price.get('change'))} ({_fmt(price.get('change_pct'))}%)",
             _fmt(price.get("open")), _fmt(price.get("high")), _fmt(price.get("low")),
             _fmt(price.get("volume"), digits=0), price.get("source", "n/a")],
        ]))

        m = (a.get("fundamentals") or {}).get("price_metrics", {})
        self._section(story, "3. Historical Performance", table=self._table([
            ["1M return", "3M return", "1Y return", "52W high", "52W low", "History"],
            [f"{_fmt(m.get('return_1m_pct'))}%", f"{_fmt(m.get('return_3m_pct'))}%", f"{_fmt(m.get('return_1y_pct'))}%",
             _fmt(m.get("high_52w")), _fmt(m.get("low_52w")), f"{m.get('history_start')} → {m.get('history_end')}"],
        ]))

        ind = a.get("indicators", {})
        latest = ind.get("latest", {})
        self._section(story, "4. Technical Analysis",
                      [f"- {sig['indicator']}: {sig['detail']} ({sig['signal']})" for sig in ind.get("signals", [])],
                      self._table([
                          ["RSI(14)", "MACD", "Signal", "SMA 50", "SMA 200", "ATR(14)", "Vol 20d (ann.)"],
                          [_fmt(latest.get("rsi_14")), _fmt(latest.get("macd"), digits=3), _fmt(latest.get("macd_signal"), digits=3),
                           _fmt(latest.get("sma_50")), _fmt(latest.get("sma_200")), _fmt(latest.get("atr_14")),
                           _fmt(latest.get("volatility_20d_annualized"), pct=True, digits=1)],
                      ]))

        f = a.get("fundamentals") or {}
        fund_paras = [f"Sector: {company.get('sector') or 'n/a'} · Industry: {company.get('industry') or 'n/a'}"]
        if f.get("provider_metrics"):
            fund_paras += [f"- {k.replace('_', ' ').title()}: {_fmt(v)}" for k, v in f["provider_metrics"].items()]
        elif f.get("note"):
            fund_paras.append(f["note"])
        self._section(story, "5. Fundamental Analysis", fund_paras)

        rows = [["Horizon", "Outlook", "P(up)", "Confidence", "Predicted price", "Target date", "Model version"]]
        for p in a.get("predictions", []):
            rows.append([f"{p['horizon_trading_days']}d", p["outlook"], _fmt(p["probability_up"], pct=True, digits=1),
                         _fmt(p["confidence"], pct=True, digits=1), _fmt(p["predicted_price"]), p["target_date"], p["model_version"]])
        self._section(story, "6. ML Prediction", table=self._table(rows))

        bt = pred.get("backtest", {})
        self._section(story, "7. Prediction Confidence & Backtesting", [
            f"Method: {bt.get('method', 'n/a')}.",
            f"Directional accuracy **{_fmt(bt.get('directional_accuracy'), pct=True, digits=1)}** vs majority-class baseline "
            f"{_fmt(bt.get('baseline_accuracy'), pct=True, digits=1)} over {bt.get('n_samples', 'n/a')} out-of-sample predictions. "
            f"Price error: MAE {_fmt(bt.get('mae'))}, RMSE {_fmt(bt.get('rmse'))}, MAPE {_fmt(bt.get('mape_pct'))}% "
            f"(naive no-change MAE {_fmt(bt.get('naive_mae'))}).",
        ])

        news = a.get("news", {})
        arts = news.get("articles", [])
        self._section(story, "8. Latest News", [
            f"- {art['title']} — {art.get('source') or 'n/a'}, {art.get('published_at') or 'n/a'} ({art.get('sentiment') or 'n/a'})"
            for art in arts[:8]
        ] or ["No recent news was available from the news provider at generation time."])

        ss = news.get("sentiment_summary", {}) or {}
        counts = ss.get("sentiment_distribution", {}) or {}
        self._section(story, "9. News Sentiment", [
            f"Overall: **{ss.get('overall_sentiment', 'n/a')}** · index {_fmt(ss.get('sentiment_index'))} · "
            f"positive {counts.get('positive', 0)}, neutral {counts.get('neutral', 0)}, negative {counts.get('negative', 0)}."
        ])

        self._section(story, "10. RAG-Based Findings", [
            f"[{d['id']}] **{d['title']}** ({d['recency']}, {d['source']}): {d['excerpt'][:350]}…"
            for d in a.get("rag_findings", [])
        ] or ["No relevant documents were retrieved."])

        self._section(story, "11. Risk Analysis", [f"- {x}" for x in risk.get("risk_factors", [])], self._table([
            ["Level", "Volatility (ann.)", "Max drawdown 1Y", "VaR 95% 1D", "CVaR 95% 1D", "Sharpe 1Y"],
            [risk.get("risk_level", "n/a"), _fmt(risk.get("annualized_volatility"), pct=True, digits=1),
             _fmt(risk.get("max_drawdown_1y"), pct=True, digits=1), _fmt(risk.get("var_95_1d"), pct=True),
             _fmt(risk.get("cvar_95_1d"), pct=True), _fmt(risk.get("sharpe_ratio_1y"))],
        ]))

        self._section(story, "12. AI Agent Conclusion", (a.get("ai_conclusion") or "").split("\n\n"))

        src_rows = [["Type", "Title", "Source", "Published", "Retrieved"]]
        for src in a.get("sources", []):
            src_rows.append([src.get("kind", ""), src.get("title", ""), src.get("source") or "",
                             src.get("published_at") or "undated", src.get("retrieved_at") or ""])
        self._section(story, "13. Sources and Timestamps", table=self._table(src_rows, widths=[25*mm, 55*mm, 40*mm, 30*mm, 30*mm]))

        self._section(story, "14. AI and Investment-Risk Disclaimer", [a.get("disclaimer", "")])
        return story

    def export_pdf(self, story: List, file_name: str) -> str:
        path = os.path.join(self.reports_dir, file_name)
        doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=15*mm, rightMargin=15*mm,
                                topMargin=15*mm, bottomMargin=15*mm, title=file_name)
        doc.build(story)
        return path

    def generate(self, symbol: str) -> Dict:
        analysis = self.collect_analysis(symbol)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        file_name = f"{analysis['symbol']}_analysis_{stamp}.pdf"
        path = self.export_pdf(self.build_report(analysis), file_name)
        record = {"stock_id": analysis["symbol"], "file_name": file_name, "storage_path": path, "status": "ready"}
        try:
            record = get_repository().insert("reports", record)
        except Exception as exc:
            logger.warning("Could not record report metadata: %s", exc)
        return record


report_service = ReportService()
