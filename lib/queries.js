module.exports = {

  visibleNow: query => {
    query.$and = query.$and || []
    query.$and.push({ $or: [{ visible_from: null }, { visible_from: { $lte: new Date } }] })
    query.$and.push({ $or: [{ visible_to: null }, { visible_to: { $gte: new Date } }] })
    return query
  },

  // filterAges: (query, req) => {
  //   query.$and = query.$and || []
  //   if(req.query.min_age){
  //     query.$and.push({ $or: [{ min_age: null }, { min_age: { $lte: parseInt(req.query.min_age) } }] })
  //   }
  //   if(req.query.min_age){
  //     query.$and.push({ $or: [{ max_age: null }, { max_age: { $lte: parseInt(req.query.max_age) } }] })
  //   }
  //   return query
  // }

  filterAges: (query, req) => {
    if(req.query.min_age){
      query.min_age = { $lte: parseInt(req.query.min_age) }
    }
    if(req.query.min_age){
      query.max_age = { $lte: parseInt(req.query.max_age) }
    }
    return query
  }

}
