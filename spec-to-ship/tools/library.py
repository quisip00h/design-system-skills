"""Prototype library: one living prototype per feature, every change logged, a frozen copy only on Ready to build.

Paths resolve from this file, so it runs from anywhere. <feature> is a kebab-case id, e.g. orders-v2.

  add-feature <feature> --module "<module>" --title "<title>" --summary "<one sentence>"
                                    create features/<feature>/ from templates/feature/ and an empty library entry
  update  <feature> "<kind>: <what> (why: <reason>)"
                                    copy prototype, specs and copy files into current/ and log the line
  note    <feature> "<kind>: <what> (why: <reason>)"   log a line only
  drop    <feature>                 remove the newest Unreleased line (logged by mistake)
  parts   <feature> spec=done copy=done fields=done   set the five parts (done, partial, draft, missing)
  release <feature> v<major>.<minor> --story <TRACKER-KEY>   (approved by the product owner, docs/versioning.md)
                                    freeze current as a read-only release (refuses while a part is not done)
  status  <feature> v<major>.<minor> Built            Ready to build, Built or Replaced
  baseline <feature> <id> --note "<what it is>"       keep current as a historical baseline (not a release)

Kinds: Added, Changed, Removed, Fixed. Authors and approvers are roles, never names.
"""
import argparse, datetime, glob, json, os, re, shutil, stat, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # repository root
LIB = os.path.join(ROOT, "library")
FEATURES = os.path.join(ROOT, "features")
FEATURE_TEMPLATE = os.path.join(ROOT, "templates", "feature")
INDEX = os.path.join(LIB, "versions.js")
HEAD = ("/* Index of the prototype library. Written by tools/library.py, edit by hand only if needed.\n"
        "   It is a script, not JSON, so the library also opens straight from disk (file://). */\n")
PARTS = ["prototype", "spec", "copy", "fields", "changelog"]
APPROVERS = ["product owner"]            # roles that may approve Ready to build (docs/versioning.md)
STATES = ["done", "partial", "draft", "missing"]


def today():
    return datetime.date.today()


def load():
    src = open(INDEX, encoding="utf-8").read()
    return json.loads(src[src.index("=") + 1:].strip().rstrip(";"))


def save(d):
    d["updated"] = today().isoformat()
    open(INDEX, "w", encoding="utf-8").write(HEAD + "window.LIBRARY_INDEX = " + json.dumps(d, ensure_ascii=False, indent=2) + ";\n")


def feature(d, fid):
    for f in d["features"]:
        if f["id"] == fid:
            return f
    known = ", ".join(f["id"] for f in d["features"]) or "none yet"
    sys.exit(f"Unknown feature {fid!r}. Known: {known}. Add one with add-feature.")


def changelog_path(f):
    return os.path.join(LIB, f["changelog"])


def read_unreleased(f):
    t = open(changelog_path(f), encoding="utf-8").read()
    m = re.search(r"^## Unreleased\n(.*?)(?=^## |\Z)", t, re.S | re.M)
    return [l[2:].strip() for l in (m.group(1) if m else "").splitlines() if l.startswith("- ")]


def add_line(f, text):
    if "…" in text or "(why)" in text or "<" in text or len(text.strip()) < 12:
        sys.exit("That looks like a placeholder. Write the real change, e.g. \"Changed: the list sorts by due date (why: usability test)\"")
    p = changelog_path(f)
    t = open(p, encoding="utf-8").read()
    line = f"- {today():%d.%m.%Y}: {text.strip()}\n"
    t = t.replace("## Unreleased\n(nothing yet)\n", "## Unreleased\n", 1)
    assert "## Unreleased\n" in t, "CHANGELOG.md has no '## Unreleased' section"
    t = t.replace("## Unreleased\n", "## Unreleased\n" + line, 1)
    open(p, "w", encoding="utf-8").write(t)


def sync(f):
    f["current"]["unreleased"] = read_unreleased(f)
    f["current"]["updated"] = today().isoformat()


def spec_label(name):
    m = re.match(r"(uc\d+)-(.+?)\.spec\.md$", name)
    if not m:
        return name
    return f"{m.group(1)} {m.group(2).replace('-', ' ').capitalize()}"


def copy_sources(f):
    """current/ is living: spec/ and copy/ are rebuilt from the feature folder on every update."""
    src = os.path.join(ROOT, f["sources"])
    cur = os.path.join(LIB, f["id"], "current")
    proto = os.path.join(src, "prototype", "index.html")
    if not os.path.isfile(proto):
        sys.exit(f"No prototype at {os.path.relpath(proto, ROOT)}: put the built, self-contained index.html there first.")
    os.makedirs(os.path.join(cur, "prototype"), exist_ok=True)
    shutil.copy2(proto, os.path.join(cur, "prototype", "index.html")); print("  copied prototype/index.html")
    for sub, pattern in (("spec", "specs/*.md"), ("copy", "copy/*.json")):
        out = os.path.join(cur, sub)
        shutil.rmtree(out, ignore_errors=True); os.makedirs(out)
        for p in sorted(glob.glob(os.path.join(src, pattern))):
            if os.path.basename(p).lower() == "readme.md":
                continue
            shutil.copy2(p, out); print(f"  copied {os.path.relpath(p, src)}")
    links = f["current"]["links"]
    links["prototype"] = f"{f['id']}/current/prototype/index.html"
    links["specs"] = [{"label": spec_label(n), "href": f"{f['id']}/current/spec/{n}"}
                      for n in sorted(os.listdir(os.path.join(cur, "spec")))]
    en = sorted(n for n in os.listdir(os.path.join(cur, "copy")) if n.endswith(".en.json"))
    links["copy"] = f"{f['id']}/current/copy/{en[0]}" if en else ""


def cmd_add_feature(a):
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.feature):
        sys.exit("Feature id must be kebab-case, e.g. orders-v2")
    d = load()
    if any(f["id"] == a.feature for f in d["features"]):
        sys.exit(f"{a.feature} exists already")
    folder = os.path.join(FEATURES, a.feature)
    if os.path.exists(folder):
        sys.exit(f"features/{a.feature} exists already; remove it or pick another id")
    shutil.copytree(FEATURE_TEMPLATE, folder)
    lib = os.path.join(LIB, a.feature)
    os.makedirs(os.path.join(lib, "current"), exist_ok=True)
    os.makedirs(os.path.join(lib, "releases"), exist_ok=True)
    open(os.path.join(lib, "CHANGELOG.md"), "w", encoding="utf-8").write(
        f"# {a.feature}, changelog\n\n"
        "One living prototype (current) per feature. Every change gets one line under Unreleased. A release is a frozen copy, "
        "made only when the product owner approves current as Ready to build; its section keeps the lines it shipped with. "
        "Write lines with `tools/library.py`.\n\n## Unreleased\n(nothing yet)\n")
    d["features"].append({
        "id": a.feature, "module": a.module, "title": a.title, "owner": "design", "summary": a.summary,
        "changelog": f"{a.feature}/CHANGELOG.md", "sources": f"features/{a.feature}", "nextVersion": a.first,
        "current": {"status": "Draft", "updated": today().isoformat(), "basedOn": None,
                    "parts": {k: ("done" if k == "changelog" else "missing") for k in PARTS},
                    "unreleased": [], "links": {"prototype": "", "specs": [], "copy": ""}},
        "releases": [], "baselines": []})
    save(d)
    print(f"Added {a.feature}: features/{a.feature}/ (from templates/feature/) and library/{a.feature}/.")
    print("Next: put the prototype, specs and copy into the feature folder, then run update.")


def cmd_update(a):
    d = load(); f = feature(d, a.feature)
    copy_sources(f); add_line(f, a.text); sync(f)
    if f["current"]["parts"].get("prototype") == "missing":
        f["current"]["parts"]["prototype"] = "done"
    save(d)
    print(f"{f['id']} current updated, logged: {a.text}")


def cmd_note(a):
    d = load(); f = feature(d, a.feature)
    add_line(f, a.text); sync(f); save(d)
    print(f"{f['id']} logged: {a.text}")


def cmd_drop(a):
    d = load(); f = feature(d, a.feature)
    p = changelog_path(f); t = open(p, encoding="utf-8").read()
    m = re.search(r"^## Unreleased\n(- [^\n]*\n)", t, re.M)
    if not m:
        sys.exit("Nothing under Unreleased to drop")
    t = t[:m.start(1)] + t[m.end(1):]
    if re.search(r"^## Unreleased\n(?!- )", t, re.M):
        t = t.replace("## Unreleased\n", "## Unreleased\n(nothing yet)\n", 1)
    open(p, "w", encoding="utf-8").write(t); sync(f); save(d)
    print(f"{f['id']} dropped: {m.group(1).strip()}  (current/ keeps the files of the last update)")


def cmd_parts(a):
    d = load(); f = feature(d, a.feature)
    for kv in a.values:
        k, _, v = kv.partition("=")
        if k not in PARTS or v not in STATES:
            sys.exit(f"Use part=state with part in {PARTS} and state in {STATES}")
        f["current"]["parts"][k] = v
    save(d); print(f"{f['id']} parts: {f['current']['parts']}")


def readonly(path):
    for base, dirs, files in os.walk(path):
        for n in files:
            p = os.path.join(base, n)
            os.chmod(p, os.stat(p).st_mode & ~(stat.S_IWUSR | stat.S_IWGRP | stat.S_IWOTH))


def cmd_release(a):
    d = load(); f = feature(d, a.feature); cur = f["current"]
    if not re.fullmatch(r"v\d+\.\d+", a.version):
        sys.exit("Version must look like v1.0")
    if a.story and not re.fullmatch(r"[A-Z][A-Z0-9]+-\d+", a.story):
        sys.exit(f"Story must be a tracker key like PRJ-900, got {a.story!r}")
    if a.by not in APPROVERS:
        sys.exit(f"--by is a role, one of {APPROVERS}, got {a.by!r}")
    if any(r["version"] == a.version for r in f["releases"]):
        sys.exit(f"{a.version} exists already; releases are never overwritten")
    open_parts = [k for k in PARTS if cur["parts"].get(k) != "done"]
    inv = os.path.join(FEATURES, f["id"], "inventory", "components.md")
    unchecked = [l for l in open(inv, encoding="utf-8")] if os.path.exists(inv) else []
    unchecked = [l for l in unchecked if l.startswith("|") and "? verify" in l and l.strip("| \n").replace("? verify", "").strip("| ")]
    if unchecked:
        open_parts.append(f"components ({len(unchecked)} unchecked in inventory/components.md)")
    if open_parts and not a.force:
        sys.exit(f"Not complete: {', '.join(open_parts)}. Finish them (parts ...=done) or pass --force \"reason\".")
    lines = read_unreleased(f)
    if not lines:
        sys.exit("Nothing under Unreleased, nothing to release")
    src = os.path.join(LIB, f["id"], "current")
    dst = os.path.join(LIB, f["id"], "releases", a.version)
    shutil.copytree(src, dst)
    readonly(dst)
    head = f"## {a.version}, {today():%d.%m.%Y}, Ready to build (set by {a.by}" + (f", {a.story}" if a.story else "") + ")"
    if a.force:
        head += f"\nReleased with open parts ({', '.join(open_parts)}): {a.force}"
    p = changelog_path(f)
    t = open(p, encoding="utf-8").read()
    m = re.search(r"^## Unreleased\n(.*?)(?=^## |\Z)", t, re.S | re.M)
    t = t[:m.start()] + "## Unreleased\n(nothing yet)\n\n" + head + "\n" + m.group(1).rstrip("\n") + "\n\n" + t[m.end():]
    open(p, "w", encoding="utf-8").write(t)
    rel = f"{f['id']}/releases/{a.version}"
    f["releases"].insert(0, {
        "version": a.version, "status": "Ready to build", "date": today().isoformat(), "by": a.by, "story": a.story,
        "changes": lines,
        "links": {"prototype": f"{rel}/prototype/index.html",
                  "specs": [{"label": s["label"], "href": s["href"].replace(f"{f['id']}/current/", f"{rel}/")} for s in cur["links"].get("specs", [])],
                  "copy": cur["links"].get("copy", "").replace(f"{f['id']}/current/", f"{rel}/")}})
    cur["unreleased"] = []; cur["basedOn"] = a.version; cur["updated"] = today().isoformat()
    mj, mn = a.version[1:].split("."); f["nextVersion"] = f"v{mj}.{int(mn) + 1}"
    save(d)
    print(f"{f['id']} {a.version} frozen in library/{rel} (read-only), changelog and index updated.")
    print(f"Link for the design ticket: view.html?v={f['id']}/{a.version}")


def cmd_status(a):
    d = load(); f = feature(d, a.feature)
    for r in f["releases"]:
        if r["version"] == a.version:
            r["status"] = a.status; save(d)
            # a status change is not a prototype change: it goes under the release, not under Unreleased
            cp = changelog_path(f); t = open(cp, encoding="utf-8").read()
            m = re.search(rf"^## {re.escape(a.version)}, .*$", t, re.M)
            if m:
                t = t[:m.end()] + f"\n- {today():%d.%m.%Y}: status {a.status}" + t[m.end():]
                open(cp, "w", encoding="utf-8").write(t)
            print(f"{f['id']} {a.version}: {a.status}"); return
    sys.exit(f"No release {a.version}")


def cmd_baseline(a):
    d = load(); f = feature(d, a.feature)
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.id):
        sys.exit("Baseline id must be kebab-case, e.g. baseline-2026-10-08")
    src = os.path.join(LIB, f["id"], "current")
    dst = os.path.join(LIB, f["id"], a.id)
    if os.path.exists(dst):
        sys.exit(f"{a.id} exists already")
    shutil.copytree(src, dst); readonly(dst)
    f["baselines"].append({"id": a.id, "label": a.label or a.id, "date": today().isoformat(), "note": a.note,
                           "links": {"prototype": f"{f['id']}/{a.id}/prototype/index.html"}})
    save(d); print(f"{f['id']} baseline {a.id} kept (read-only)")


ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
sp = ap.add_subparsers(dest="cmd", required=True)
p = sp.add_parser("add-feature"); p.add_argument("feature"); p.add_argument("--module", required=True)
p.add_argument("--title", required=True); p.add_argument("--summary", required=True)
p.add_argument("--first", default="v1.0", help="number of the first release, default v1.0"); p.set_defaults(fn=cmd_add_feature)
for name, fn in [("update", cmd_update), ("note", cmd_note)]:
    p = sp.add_parser(name); p.add_argument("feature"); p.add_argument("text"); p.set_defaults(fn=fn)
p = sp.add_parser("drop"); p.add_argument("feature"); p.set_defaults(fn=cmd_drop)
p = sp.add_parser("parts"); p.add_argument("feature"); p.add_argument("values", nargs="+"); p.set_defaults(fn=cmd_parts)
p = sp.add_parser("release"); p.add_argument("feature"); p.add_argument("version"); p.add_argument("--by", default="product owner")
p.add_argument("--story", default=""); p.add_argument("--force", default=""); p.set_defaults(fn=cmd_release)
p = sp.add_parser("status"); p.add_argument("feature"); p.add_argument("version")
p.add_argument("status", choices=["Ready to build", "Built", "Replaced"]); p.set_defaults(fn=cmd_status)
p = sp.add_parser("baseline"); p.add_argument("feature"); p.add_argument("id"); p.add_argument("--label", default="")
p.add_argument("--note", required=True); p.set_defaults(fn=cmd_baseline)
a = ap.parse_args(); a.fn(a)
