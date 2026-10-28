// expect: none
export function Clean({ count, onSave }) {
  return (
    <section style={{ padding: 16, fontSize: 14, fontWeight: 700 }} className="transition-opacity">
      <h2>Recent activity</h2>
      <p>{count} items changed since your last visit.</p>
      <Button onClick={() => onSave()}>Save changes</Button>
    </section>
  );
}
