module.exports.visibleNow = (query) => {
  query.$and = query.$and || []
  query.$and.push({ $or: [{ visible_from: null }, {visible_from: { $lte: new Date } }] })
  query.$and.push({ $or: [{ visible_to: null }, {visible_to: { $gte: new Date } }] })
  return query
}