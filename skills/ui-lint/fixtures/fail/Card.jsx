// expect: raw-colour 2, off-scale-spacing 2, off-scale-font-size 1, transition-all 1, title-case 1, forbidden-word 1
export function Card({ label, count, onSave }) {
  return (
    <div style={{ padding: 13, color: '#1e2328' }} className="transition-all p-[18px] bg-[#f5f6f7]">
      <h3>Account Settings</h3>
      <span style={{ fontSize: 15 }}>{label}</span>
      <p>{count} files, simply drop more here.</p>
      <button className="gap-4" onClick={() => onSave()}>Save changes</button>
    </div>
  );
}
