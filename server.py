import re
import datetime
from datetime import timedelta
from os import getenv
from os.path import join, dirname

from dotenv import load_dotenv
load_dotenv(join(dirname(__file__), '.env'))
from flask import Flask, render_template, request, redirect, g, abort, session

import src.internals.database.database as database
import src.internals.cache.redis as redis
from src.internals.cache.flask_cache import cache
from src.lib.ab_test import get_all_variants
from src.lib.account import is_logged_in
from src.utils.utils import url_is_for_non_logged_file_extension

from src.pages.home import home
from src.pages.legacy import legacy
from src.pages.artists import artists
from src.pages.random import random
from src.pages.post import post
from src.pages.account import account
from src.pages.favorites import favorites
from src.pages.help import help_app
from src.pages.proxy import proxy_app

app = Flask(
    __name__,
    template_folder='views'
)

app.url_map.strict_slashes = False

app.register_blueprint(home)
app.register_blueprint(legacy)
app.register_blueprint(artists)
app.register_blueprint(random)
app.register_blueprint(post)
app.register_blueprint(account)
app.register_blueprint(favorites)
app.register_blueprint(help_app, url_prefix='/help')
app.register_blueprint(proxy_app, url_prefix='/proxy')

app.config.from_pyfile('flask.cfg')
app.jinja_env.globals.update(is_logged_in=is_logged_in)
app.jinja_env.filters['regex_match'] = lambda val, rgx: re.search(rgx, val)
app.jinja_env.filters['regex_find'] = lambda val, rgx: re.findall(rgx, val)

cache.init_app(app)
database.init()
redis.init()

@app.before_request
def do_init_stuff():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=9999)
    session.modified = False

@app.errorhandler(413)
def upload_exceeded(error):
    props = {
        'redirect': request.headers.get('Referer') if request.headers.get('Referer') else '/'
    }
    limit = int(getenv('REQUESTS_IMAGES')) if getenv('REQUESTS_IMAGES') else 1048576
    props['message'] = 'Submitted file exceeds the upload limit. {} MB for requests images.'.format(
        limit / 1024 / 1024
    )
    return render_template(
        'error.html',
        props = props
    ), 413

@app.teardown_appcontext
def close(e):
    cursor = g.pop('cursor', None)
    if cursor is not None:
        cursor.close()
        connection = g.pop('connection', None)
        if connection is not None:
            pool = database.get_pool()
            connection.commit()
            pool.putconn(connection)
