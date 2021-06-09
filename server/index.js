const express = require('express')
const app = express()
const port = 5000;
const cookieParser = require('cookie-parser');
// const bodyParser = require('body-parser');
const { User } = require('./models/User');
const { auth } = require('./middleware/auth')
const config = require('./config/dev')

app.use(express.urlencoded({extended: true}));

app.use(express.json());
app.use(cookieParser());

const mongoose = require('mongoose')

mongoose.connect(config.mongoURL, {
    useNewUrlParser : true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify : false
}).then(() => console.log("MongoDb Connected!!"))
  .catch(err => console.log(err))

app.get('/', (req, res) => {
  res.send('Hello World! test test121243')
})
  



  // 회원 가입할때 필요한 정보들을 client에서 가져오면
  // 그것들은 DB에 넣어준다

  app.post("/api/users/register",(req,res)=>{

    const user = new User(req.body);

    // 회원가입
    user.save((err, userInfo) => {
      if (err) return res.json({ success: false, err })
      return res.status(200).json({
          success: true
      })
    })
  })




  // 로그인
  app.post('/api/users/login', (req, res) => {


    // 요청된 이메일을 데이터베이스에서 있는지 찾기
    User.findOne({ email: req.body.email }, (err, user) => {
      if (!user) {
        return res.json({
          loginSuccess: false,
          message: "제공된 이메일에 해당하는 유저가 없습니다."
        })
      }
    

    // 있으면 email과 비밀번호가 같은지 확인
    user.comparePassword(req.body.password, (err, isMatch) => {
      
      if(!isMatch) 
        return res.json({ loginSuccess : false, message : "비밀번호가 틀림" })

      // 맞으면 토큰 생성  
      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        // 토큰을 저장한다.  어디에 ?  쿠키 , 로컳스토리지 
        res.cookie("x_auth", user.token)
          .status(200)
          .json({ loginSuccess: true, userId: user._id })
        })
      })
    })
  })


  // Auth 기능
  // auth 중간 미들웨어
  app.get('/api/users/auth', auth, (req, res) => {

    req.status(200).json({

      _id : req.user._id,
      isAdmin: req.user.role == 0 ? false : true,
      usAuth : true,
      email: req.user.email,
      name : req.user.name,
      lastname : req.user.lastname,
      role: req.user.role,
      image: req.user.image
    })
  }) 

  app.get('/api/user/logout', auth ,(req, res) => {

    User.findOneAndUpdate({ _id: req.user._id},
      {token : ""} , (err, user) => {
      if(err) return res.json({ success: false, err });
      return res.status(200).send({
        success : true
      })
    })
  })

  // 프론트 연결 테스트1
  app.get('/api/hello', (req, res) => {
    res.send('안녕 테스트');
  })



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
}) 