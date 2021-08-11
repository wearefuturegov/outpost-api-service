module.exports = {

  visibleNow: query => {
    query.$and = query.$and || []
    query.$and.push({ $or: [
      { visible_from: null }, 
      { visible_from: { $lte: new Date } }
    ]})
    query.$and.push({ $or: [
      { visible_to: null }, 
      { visible_to: { $gte: new Date } }
    ]})
    return query
  },

  // This filter returns all services with an age range overlapping with the
  // range supplied by the user.
  filterAges: (query, req) => {
    query.$and = query.$and || []

    const min_age = req.query.min_age
    const max_age = req.query.max_age

    if(min_age){
      query.$and.push({ $or: [
        { max_age: null },
        { max_age: { $gte: parseInt(min_age) } }
      ]})
    }

    if(max_age){
      query.$and.push({ $or: [
        { min_age: null },
        { min_age: { $lte: parseInt(max_age) } }
      ]})
    }

    return query
  },

  filterOnly: (query, req) => {
    let { only } = req.query
    if(only){
      if(only.includes("free")) query.free = true
      // if(only.includes("open-weekends")) query["regular_schedules.weekday"] = { $in: [ "Saturday", "Sunday"] }
      // if(only.includes("open-after-six")) query["regular_schedules.closes_at"] = { $gte: "18:00"}
    }
    return query
  }

}
