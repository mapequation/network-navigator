/**
 * @file This file deals with parsing data in the
 * [Pajek format]{@link http://www.mapequation.org/code.html#Pajek-format}
 * to an object representation.
 *
 * @author Christopher Blöcker
 */

/**
 * Checks whether the given row has the form of a declaration.
 * A declataion row has a length of 2 and starts with a declaration string,
 * followed by something that can be parsed to an integer.
 *
 * @param row
 * @param declarationString
 *
 * @return
 */
function isDeclaration(row, declarationString)
{
  return row.length                      === 2
      && row[0].toString().toLowerCase() === declarationString.toLowerCase()
      && parseInt(row[1])                !== NaN
      ;
}

function isNodeDefinition(row)
{
  if (row.length === 2)
    return parseInt(row[0]) !== NaN;

  if (row.length === 3)
    return parseInt(row[0])   !== NaN
        && parseFloat(row[2]) !== NaN
        ;

  return false;
}

function isLinkDefinition(row)
{
  if (row.length === 2)
    return parseInt(row[0]) !== NaN
        && parseInt(row[1]) !== NaN
        ;

  if (row.length === 3)
    return parseInt(row[0])   !== NaN
        && parseInt(row[1])   !== NaN
        && parseFloat(row[2]) !== NaN
        ;

  return false;
}

export default function parsePajek(rows)
{
  const result = { data   : { nodes : []
                            , links : []
                            }
                 , errors : []
                 , meta   : { linkType : "undirected"
                            }
                 };

  var i = 0
    , numNodes
    , numLinks
    , error = false
    ;

  // we expect a line that tells us how many nodes there are
  if (isDeclaration(rows[i], "*Vertices"))
    numNodes = +rows[i++][1];
  else
  {
    result.errors.push("Expected *Vertices declaration but got " + rows[i].toString());
    error = true;
  }

  // now we can read all the nodes and their labels
  for (; !(error = !isNodeDefinition(rows[i])) && i < numNodes + 1; ++i)
    result.data.nodes.push({ id    : +rows[i][0]
                           , label : rows[i][1].toString()
                           , flow  : +rows[i][2] | 1
                           });

  // we expect a line that tells us how many links there are
  if (isDeclaration(rows[i], "*Edges") || isDeclaration(rows[i], "*Arcs"))
    numLinks = +rows[i++][1];
  else
  {
    result.errors.push("Expected *Edges declaration but got " + rows[i].toString());
    error = true;
  }

  // now we can read all the links
  for (; i < numNodes + numLinks + 2 && !(error = !isLinkDefinition(rows[i])); ++i)
  {
    result.data.links.push({ source : +rows[i][0]
                           , target : +rows[i][1]
                           , flow   : +rows[i][2] | 1
                           });
  }

  return result;
}
