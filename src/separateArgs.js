import {TypeKind} from 'graphql/type/introspection';
const {LIST} = TypeKind;
import {ensureTypeFromNonNull} from './utils';

const getSuppliedArgs = (args, variableValues = {}, paginationWords) => {
  const regularArgs = {};
  const paginationArgs = {};
  args
    .sort((a, b) => a.name.value < b.name.value)
    .forEach(arg => {
      const argName = arg.name.value;
      let argValue = arg.value.value || variableValues[argName];
      if (!argValue) return;
      let paginationMeaning = Object.keys(paginationWords).find(pageWord => paginationWords[pageWord] === argName);
      if (paginationMeaning) {
        if (paginationMeaning === 'first' || paginationMeaning === 'last') {
          argValue = parseInt(argValue);
          if (paginationMeaning === 'first') {
            if (paginationWords.first === paginationWords.last && args.find(arg => arg.name.value === 'before')) {
              paginationMeaning = 'last';
            }
          }
        }

        paginationArgs[paginationMeaning] = argValue;
      } else {
        regularArgs[argName] = argValue;
      }
    });
  const {before, after, first, last} = paginationArgs;
  if (before && !last || after && !first || before && first || after && last || before && after || first && last) {
    console.error('Pagination options are: `before, last` `after, first`, `first`, and `last`');
  }
  return {regularArgs, paginationArgs};
};

const getPossibleArgs = (schema, paginationWords) => {
  if (!schema.args) return {};
  let acceptsRegularArgs = false;
  let acceptsPaginationArgs = false;
  const paginationWordSet = Object.keys(paginationWords)
    .reduce((reduction, key) => reduction.add(paginationWords[key]), new Set());
  schema.args.forEach(arg => {
    if (paginationWordSet.has(arg.name)) {
      acceptsPaginationArgs = true;
    } else {
      acceptsRegularArgs = true;
    }
  });
  return {acceptsRegularArgs, acceptsPaginationArgs};
};

export const separateArgs = (fieldSchema, reqASTArgs, {paginationWords, variableValues}) => {
  const responseType = ensureTypeFromNonNull(fieldSchema.type);
  const {acceptsRegularArgs, acceptsPaginationArgs} = getPossibleArgs(fieldSchema, paginationWords);
  let {regularArgs, paginationArgs} = getSuppliedArgs(reqASTArgs, variableValues, paginationWords);
  regularArgs = acceptsRegularArgs && regularArgs;
  paginationArgs = acceptsPaginationArgs && paginationArgs;
  if (paginationArgs && responseType.kind !== LIST) {
    console.warn(`${responseType} is not a List. Pagination args ignored`);
    paginationArgs = false;
  }
  return {regularArgs, paginationArgs}
};