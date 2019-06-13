const createError      = require('http-errors'),
      express          = require('express'),
      cookieParser     = require('cookie-parser'),
      session          = require('express-session'),
      path             = require('path'),
      logger           = require('morgan'),
      exphbs           = require("express-handlebars"),
      expressValidator = require('express-validator'),
      bodyParser       = require('body-parser'),
      flash            = require('connect-flash'),
      passport         = require('passport'),
      LocalStrategy    = require('passport-local').Strategy,
      mongo            = require("mongodb"),
      mongoose         = require('mongoose'),
      jwt              = require('jsonwebtoken'),
      Async            = require('async');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/afsanauth');
var db = mongoose.connection;

// Router sitter
var indexRouter = require('./routes/index'),
    usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars',exphbs({defaultLayout:'layout'}));
app.set('view engine','handlebars');

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Handle session afsan007
app.use(session({
  secret:'$2b$10$xd3WzHObGLmDvHdR9ZPbXOxorJ0LrEDpmgQUIoWA6uhUaoEp/xV2m',
  saveUninitialized:true,
  resave: true,
  cookie: {expires: new Date(Date.now() + 900000),sameSite: true},
}));

app.use(expressValidator({
  errorFormatter:function(param,msg,value){
    var namespace = param.split('.'),
        root      = namespace.shift(),
        formParam = root;
    while(namespace.length){
      formParam += '['+namespace.shift()+']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
//connect flash
app.use(flash());

//Global Vars
app.use(function(req,res,next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.err = req.flash('error');
  next();
});
app.use('/', indexRouter);
app.use('/users', usersRouter);
// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
// 
// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};
// 
//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });
app.listen(3000,()=>{
  console.log('server is running on port 3000');
});
module.exports = app;
