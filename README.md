# Certamus

The competition record of [Conyso](https://conyso.com): the case competitions
and hackathons the team enters, what was argued in each, and how it went.

**This repository is a mirror.** The published site is
[conyso.com/certamus/](https://conyso.com/certamus/), and every page here
carries a canonical link pointing there, so search engines index the original
rather than this copy.

## What is in here

The pages are generated from `data/certamus/` in the Conyso site repository by
`certamus_gen.py`; nothing here is hand-edited. This mirror is the generated
output plus the three things the pages reach for outside their own folder: the
site stylesheet, the font stylesheet and the fonts, and the images.

Two paths are rewritten when the mirror is assembled, because they are absolute
on conyso.com and would break on a project path here:

- `fonts.css` asks for `/fonts/…`, which resolves to the domain root. It is
  made relative to the stylesheet.
- The nav's Conyso link is `../`, which here would land on this repository's
  own landing page and bounce back. It points at conyso.com instead.

## Licence

The text and images are Conyso's. Competition briefs belong to the organisers
who wrote them and are restated in our own words; where an organiser has given
permission to reproduce one, the page says so and names the permission.
