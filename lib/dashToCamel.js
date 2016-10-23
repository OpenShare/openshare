// type contains a dash
// transform to camelcase for function reference
// TODO: only supports single dash, should should support multiple
export default (dash, type) => {
  const nextChar = type.substr(dash + 1, 1);
  const group = type.substr(dash, 2);

  type = type.replace(group, nextChar.toUpperCase());
  return type;
};
