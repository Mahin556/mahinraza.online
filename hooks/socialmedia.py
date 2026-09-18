from textwrap import dedent
import urllib.parse

x_intent = "https://x.com/intent/tweet"
fb_sharer = "https://www.facebook.com/sharer/sharer.php"


def on_page_markdown(markdown, **kwargs):
    page = kwargs["page"]
    config = kwargs["config"]

    if page.meta.get("template") != "blog-post.html":
        return markdown

    page_url = config.site_url + page.url
    page_title = urllib.parse.quote(page.title)

    return markdown + dedent(f"""
    <div style="text-align: center;" markdown="1">

    ## Share on Socials

    [Share on :simple-x:]({x_intent}?text={page_title}&url={page_url}) &nbsp;&nbsp;
    [Share on :simple-facebook:]({fb_sharer}?u={page_url})

    </div>
    """)