module.exports = function health(req, res) {
  const data = {
    uptime: process.uptime(),
    message: "Ok",
    date: new Date(),
  }

  res.status(200).send(data)
}
