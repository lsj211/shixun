from flask import Flask, render_template, request, redirect, url_for, session
from flask_mysqldb import MySQL
import bcrypt

app = Flask(__name__)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = '20050721'  # 替换为你的 MySQL 密码
app.config['MYSQL_DB'] = 'shixun'
app.config['SECRET_KEY'] = '123'  # 替换为安全的密钥

mysql = MySQL(app)

# 路由：首页（重定向到登录页）
@app.route('/')
def index():
    return redirect(url_for('login'))

# 路由：登录页面
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # 获取表单数据
        username = request.form['username']
        password = request.form['password']

        # 查询数据库
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, username, password_hash FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()

        # 验证用户
        if user and bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
            # 登录成功，保存会话
            session['user_id'] = user[0]
            session['username'] = user[1]
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid username or password')

    return render_template('login.html')


@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    # 获取用户创建日期
    cur = mysql.connection.cursor()
    cur.execute("SELECT created_at FROM users WHERE id = %s", (session['user_id'],))
    user_data = cur.fetchone()
    cur.close()

    return render_template('setting.html', username=session['username'], created_at=user_data[0])




@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # 获取表单数据
        username = request.form['username']
        password = request.form['password']

        # 检查用户名是否已存在
        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            cur.close()
            return render_template('register.html', error='Username already exists')

        # 加密密码
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # 插入新用户
        cur.execute("INSERT INTO users (username, password_hash) VALUES (%s, %s)", (username, password_hash))
        mysql.connection.commit()
        cur.close()

        return redirect(url_for('login'))

    return render_template('register.html')

# 路由：注销
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)    