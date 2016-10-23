/*
   Sometimes social platforms get confused and drop share counts.
   In this module we check if the returned count is less than the count in
   localstorage.
   If the local count is greater than the returned count,
   we store the local count + the returned count.
   Otherwise, store the returned count.
*/

export default (t, count) => {
  const isArr = t.type.indexOf(',') > -1;
  const local = Number(t.storeGet(`${t.type}-${t.shared}`));

  if (local > count && !isArr) {
    const latestCount = Number(t.storeGet(`${t.type}-${t.shared}-latestCount`));
    t.storeSet(`${t.type}-${t.shared}-latestCount`, count);

    count = isNumeric(latestCount) && latestCount > 0 ?
      count += local - latestCount :
      count += local;
  }

  if (!isArr) t.storeSet(`${t.type}-${t.shared}`, count);
  return count;
};

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
