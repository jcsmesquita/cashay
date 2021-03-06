import {FRAGMENT_SPREAD, INLINE_FRAGMENT} from 'graphql/language/kinds';

export const getSubReqAST = (key, reqAST, fragments) => {
  let subReqAST;
  for (let selection of reqAST.selectionSet.selections) {
    if (selection.kind === INLINE_FRAGMENT) {
      subReqAST = getSubReqAST(key, selection, fragments);
    } else if (selection.alias && selection.alias.value === key || selection.name.value === key) {
      subReqAST = selection;
    }
    if (subReqAST) {
      return subReqAST;
    }
  }
  throw new Error(`${key} was found in the query response, but not the request.
    Did you optimistically add more fields than you originally requested?`)
};
