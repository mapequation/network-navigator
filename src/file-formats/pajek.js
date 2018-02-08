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
  return row.length       == 2
      && row[0]           == declarationString
      && parseInt(row[1]) != NaN
      ;
}

function isNodeDefinition(row)
{
  return row.length == 2
      && parseInt(row[0]) != NaN
      ;
}

function isLinkDefinition(row)
{
  return row.length         == 3
      && parseInt(row[0])   != NaN
      && parseInt(row[1])   != NaN
      && parseFloat(row[2]) != NaN
}

export default function parsePajek(rows)
{
  const result = { data   : { nodes : []
                            , links : []
                            }
                 , errors : []
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
                           });

  // we expect a line that tells us how many links there are
  if (isDeclaration(rows[i], "*Edges"))
    numLinks = +rows[i++][1];
  else
  {
    result.errors.push("Expected *Edges declaration but got " + rows[i].toString());
    error = true;
  }

  // now we can read all the links
  for (; i < numNodes + numLinks + 2 && !(error = !isLinkDefinition(rows[i])); ++i)
  {
    console.log(rows[i])
    result.data.links.push({ source : +rows[i][0]
                           , target : +rows[i][1]
                           , flow   : +rows[i][2]
                           });
  }

  return result;
}
