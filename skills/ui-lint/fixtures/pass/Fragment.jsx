// expect: none
// The .list context sits in the parent component; this fragment only knows .row.
const styles = css`.list .row small { font-size: 12px; }`;
export const Row = ({ name }) => <li className="row">{name} <small>updated today</small></li>;
