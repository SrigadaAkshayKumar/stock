from services.rag.processing import clean_text


def test_clean_text_keeps_comparisons():
    assert clean_text("Trades at a P/E < 20 while ROE > 15%.") == "Trades at a P/E < 20 while ROE > 15%."


def test_clean_text_keeps_escaped_comparisons():
    assert clean_text("Debt/equity &lt; 0.5 and growth &gt; 12%") == "Debt/equity < 0.5 and growth > 12%"


def test_clean_text_still_strips_markup():
    html = '<p>Margins <b>improved</b> <a href="https://example.com/q2">in Q2</a><!-- ad --></p>'
    assert clean_text(html) == "Margins improved in Q2"
