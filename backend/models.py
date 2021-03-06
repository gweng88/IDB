from heapq import heappush, heappop
from sqlalchemy.ext.declarative import declarative_base, declared_attr
from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, create_engine, Table, UnicodeText
from sqlalchemy.orm import sessionmaker, relationship, configure_mappers
from sqlalchemy_searchable import make_searchable
from sqlalchemy_utils.types import TSVectorType
from sqlalchemy.sql import select
import datetime
import json
import os

Base = declarative_base()

make_searchable()

DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
DB_PASS = os.environ['DB_PASS']
DB_DIALECT = os.environ['DB_DIALECT']
DB_HOST = os.environ['DB_HOST']
# To create this schema, ensure that the DB_NAME database exists,
# and that DB_USER:DB_PASS is correct. Then using the above Base object
# do: Base.metadata.create_all(engine) to initialize a blank db (or nop
# if it already exists)

db = create_engine('{dialect}://{user}:{password}@{host}/{db}'.format(dialect=DB_DIALECT, user=DB_USER, password=DB_PASS, host=DB_HOST, db=DB_NAME))
_session_maker = None

# Defined this way so configuration isn't loaded until a Session is requested
def Session():
    global _session_maker
    if not _session_maker:
        _session_maker = sessionmaker(bind=db)
    return _session_maker()

class DBObject: # Everything
    id = Column(Integer, primary_key=True)
    name = Column(UnicodeText)

CrateItemsRelation = Table('crate_item_relations', Base.metadata,
    Column('crate_id', ForeignKey('crates.id'), primary_key=True),
    Column('item_id', ForeignKey('objects.id'), primary_key=True)) # Foreign key to all returnable types


DLCItemsRelation = Table('dlc_item_relations', Base.metadata,
    Column('dlc_id', ForeignKey('dlcs.id'), primary_key=True),
    Column('item_id', ForeignKey('objects.id'), primary_key=True))

class RLObject(Base, DBObject): # Non-meta
    __tablename__ = 'objects'

    id = Column(Integer, primary_key=True)

    type = Column('type', UnicodeText)
    __mapper_args__ = {'polymorphic_on': type}

    image = Column(String) # URL of image
    crates = relationship('Crate',
        secondary=CrateItemsRelation,
        primaryjoin=id==CrateItemsRelation.c.item_id)
    dlcs = relationship('DLC',
        secondary=DLCItemsRelation,
        primaryjoin=id==DLCItemsRelation.c.item_id)    
    @declared_attr
    def platform(cls):
        return Column(Integer, ForeignKey('platforms.id'))

    def __eq__(self, other):
        return serialize_str(self) == serialize_str(other)

    def __lt__(self, other):
        return self.name < other.name

    def __repr__(self):
        return "<RLObject(id='{0}', name='{1}', type='{2}')>".format(
                                self.id, self.name, CLASS_TO_TYPE.get(type(self)))

class RLObtainable(RLObject): # Not Players
    release_date = Column(Date)
    description = Column(UnicodeText)
    search_vector = Column(TSVectorType('name', 'description', 'type'))

class RLItem(RLObtainable): # Not DLC
    @declared_attr
    def source(cls):
        return Column(Integer, ForeignKey('sources.id'))

    @declared_attr
    def rarity(cls):
        return Column(Integer, ForeignKey('rarities.id'))

# Used for ForeignKey
class Source(Base, DBObject):
    __tablename__ = 'sources'

# Used for ForeignKey
class Rarity(Base, DBObject):
    __tablename__ = 'rarities'

# Used for ForeignKey
class Platform(Base, DBObject):
    __tablename__ = 'platforms'

PaintDecalsRelation = Table('paint_decal_relations', Base.metadata,
    Column('paint_id', ForeignKey('paints.id'), primary_key=True),
    Column('decal_id', ForeignKey('decals.id'), primary_key=True))

class Paint(RLItem):
    __tablename__ = 'paints'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'paint'}
    crate = Column(ForeignKey('crates.id')) # ForeignKey
    decals = relationship('Decal',
        secondary=PaintDecalsRelation,
        primaryjoin=id==PaintDecalsRelation.c.paint_id)

BodyDecalsRelation = Table('body_decal_relations', Base.metadata,
    Column('body_id', ForeignKey('bodies.id'), primary_key=True),
    Column('decal_id', ForeignKey('decals.id'), primary_key=True))

class Body(RLItem):
    __tablename__ = 'bodies'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'body'}
    decals = relationship('Decal',
        secondary=BodyDecalsRelation,
        primaryjoin=id==BodyDecalsRelation.c.body_id)

class Decal(RLItem):
    __tablename__ = 'decals'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'decal'}
    crate = Column(Integer, ForeignKey('crates.id')) # ForeignKey
    is_animated = Column(Boolean)
    is_paintable = Column(Boolean)
    paints = relationship('Paint',
        secondary=PaintDecalsRelation,
        primaryjoin=id==PaintDecalsRelation.c.decal_id)
    bodies = relationship(Body,
        secondary=BodyDecalsRelation,
        primaryjoin=id==BodyDecalsRelation.c.decal_id)
    def __hash__(self):
        return hash(self.id)

class Wheel(RLItem):
    __tablename__ = 'wheels'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'wheel'}

class Topper(RLItem):
    __tablename__ = 'toppers'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'topper'}

class Antenna(RLItem):
    __tablename__ = 'antennas'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'antenna'}

class Explosion(RLItem):
    __tablename__ = 'explosions'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'explosion'}


class Boost(RLItem):
    __tablename__ = 'boosts'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'boost'}


class Trail(RLItem):
    __tablename__ = 'trails'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'trail'}

class Banner(RLItem):
    __tablename__ = 'banners'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'banner'}


class Crate(RLItem):
    __tablename__ = 'crates'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'crate'}
    retire_date = Column(Date)
    items = relationship(RLObject,
        secondary=CrateItemsRelation,
        primaryjoin=id==CrateItemsRelation.c.crate_id)


class DLC(RLObtainable):
    __tablename__ = 'dlcs'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'dlc'}
    items = relationship(RLObject,
        secondary=DLCItemsRelation,
        primaryjoin=id==DLCItemsRelation.c.dlc_id)

class Player(RLObject):
    __tablename__ = 'players'
    id = Column(ForeignKey('objects.id'), primary_key=True)
    __mapper_args__ = {'polymorphic_identity': 'player'}
    skill_rating = Column(Integer) # Average of Ranked modes in most recent season
    wins = Column(Integer)
    sig_image = Column(String)
    profile_url = Column(String)

TYPE_TO_CLASS = {
    'paint': Paint,
    'body': Body,
    'decal': Decal,
    'crate': Crate,
    'dlc': DLC,
    'player': Player,
    'wheel': Wheel,
    'boost': Boost,
    'antenna': Antenna,
    'topper': Topper,
    'explosion': Explosion,
    'trail': Trail,
    'banner': Banner
}

CLASS_TO_TYPE = {v: k for k, v in TYPE_TO_CLASS.items()}

RELATION_KEYS = {
    Paint: ['decals'],    
    Body: ['decals'],
    Decal: ['bodies', 'paints'],
    Crate: ['items'],
    DLC: ['items']
}

RELATION_KEY_TARGETS = {
    'decals': Decal,
    'bodies': Body,
    'paints': Paint,
    'items': RLObject,
    
}

def serialize(rl_object):
    if rl_object is None:
        return None
    sdict = {k: rl_object.__dict__[k] for k in rl_object.__dict__ if not k.startswith('_')}
    sdict['type'] = CLASS_TO_TYPE.get(type(rl_object))
    if 'search_vector' in sdict:
        del sdict['search_vector']    
    for rel in (RELATION_KEYS.get(type(rl_object), []) + ['crates', 'dlcs']):
        sdict[rel] = list(k.id for k in getattr(rl_object, rel))
    if 'release_date' in sdict:
        if sdict['release_date']:
            sdict['release_date'] = sdict['release_date'].isoformat()
    return sdict

def serialize_str(rl_object):    
    return json.dumps(serialize(rl_object))

# Deserializes json into an object (or None if type unknown)
# this returns a new instance of that object
def deserialize(json_str):
    sdict = json.loads(json_str)
    return _deserialize_helper(sdict)

def _deserialize_helper(sdict):
    class_ = TYPE_TO_CLASS.get(sdict.get('type'))
    if class_:
        for rem in RELATION_KEYS.get(class_, []):
            if rem in sdict:
                del sdict[rem]
        del sdict['type']
        if 'release_date' in sdict:
            if sdict['release_date']:
                sdict['release_date'] = datetime.datetime.strptime(sdict['release_date'], '%Y-%m-%d').date()
            else:
                del sdict['release_date']
        # print(sdict['release_date'])
        return class_(**sdict)
    return None

def deserialize_list(json_str):
    json_list = json.loads(json_str)
    object_list = [_deserialize_helper(json) for json in json_list]
    return object_list

def search(class_, terms):
    terms = [k.lower() for k in terms]
    s = Session()
    pq = []

    for obj in s.query(class_):
        counter = 0
        for attr in vars(obj):
            if attr.startswith('_'):
                continue
            for term in terms:
                val = str(getattr(obj, attr)).lower()
                while term in val:
                    counter += 1
                    val = val.replace(term, '')
        heappush(pq, (-counter, obj, counter))

    ret = []
    for _ in range(len(pq)):
        consider = heappop(pq)
        if consider[2] <= 0:
            break
        ret.append(consider[1])

    return ret
