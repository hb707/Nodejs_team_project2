const { promisePool } = require('../../../db')

// 브라우저에서 ajax로 요청하면 db에서 게시글 목록 전달
const listApi = async (req, res) => {
    const { cgArr } = req.body
    // 1. cgArr로 카테고리 인덱스 조회 : 쿼리문 하나로 통합해서 쓸 수도 있을 것 같은데 방법을 잘 모르겠음..
    // sql1 : 모든 카테고리 조회시. cgArr.length=0
    const sql0 = `select board.idx, title, DATE_FORMAT(date,'%Y-%m-%d') as date, view, count(lid) as likes, nickname, img 
                from board 
                left join user on board.b_userid = user.userid 
                left join img on img.bid = board.idx and img.seq = 1
                left join likes on board.idx = likes.bid
                where board.board_name = 'main' and active = 1
                group by board.idx
                order by board.idx desc`

    // sql2 : 메인 카테고리로 조회시. cgArr.length = 1
    const sql1 = `select board.idx, title, DATE_FORMAT(date,'%Y-%m-%d') as date, view, count(lid) as likes, nickname, img  
                from board 
                left join user on board.b_userid = user.userid 
                left join img on img.bid = board.idx and img.seq = 1
                left join category as cg on board.cg_idx = cg.idx
                left join likes on board.idx = likes.bid
                where board.board_name = 'main' and active = 1 and m_url = '${cgArr[0]}'
                group by board.idx
                order by board.idx desc`

    // sql3 : 서브카테고리로 조회시. cgArr.length = 2
    const sql2 = `select board.idx, title, DATE_FORMAT(date,'%Y-%m-%d') as date, view, count(lid) as likes, nickname, img  
                from board 
                left join user on board.b_userid = user.userid 
                left join img on img.bid = board.idx and img.seq = 1
                left join category as cg on board.cg_idx = cg.idx
                left join likes on board.idx = likes.bid
                where board.board_name = 'main' and active = 1 and m_url = '${cgArr[0]}' and s_url = '${cgArr[1]}'
                group by board.idx
                order by board.idx desc`

    const sqlImg = `select img from img where bid=idx limit 1,1`
    let response = {
        errno: 1
    }
    try {
        await promisePool.execute(`SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'`)
        let result
        if (cgArr.length == 0) {
            [result] = await promisePool.execute(sql0)
        } else if (cgArr.length == 1) {
            [result] = await promisePool.execute(sql1)
        } else if (cgArr.length == 2) {
            [result] = await promisePool.execute(sql2)
        }
        console.log(result)
        response = {
            ...response,
            errno: 0,
            result: result,
        }
        res.json(response)
    } catch (e) {
        console.log(e)
        res.json(response)
    }
}
// 프론트서버에서 ajax 요청시 db에서 해당 idx의 글 정보, 현재 접속한 유저 정보 전달
const viewApi = async (req, res) => {
    const sql = ``
    let response = {
        errno: 1
    }
    const conn = await pool.getConnection()
    try {
        const [result] = await conn.execute(sql)
        response = {
            ...response,
            errno: 0,
            result: result,
        }
        res.json(response)
    } catch (e) {
        console.log(e)
        res.json(response)
    } finally { conn.release() }
}


// delete시 삭제권한 확인 후 db에서 해당 내용 삭제
const deleteApi = async (req, res) => {
    const sql = ``
    let response = {
        errno: 1
    }
    const conn = await pool.getConnection()
    try {
        const [result] = await conn.execute(sql)
        response = {
            ...response,
            errno: 0,
            result: result,
        }
        res.json(response)
    } catch (e) {
        console.log(e)
        res.json(response)
    } finally { conn.release() }
}


const checkLikeApi = async (req, res) => {
    const { idx } = req.body
    //const { userid } = req.userInfo
    const userid = 'admin'
    const sql1 = `SELECT * FROM likes where bid=${idx} and l_userid='${userid}'`
    let response = {
        errno: 1
    }
    try {
        const [result] = await promisePool.execute(sql1)
        response = {
            ...response,
            errno: 0,
            result
        }
        res.json(response)
    } catch (e) {
        console.log(e)
        res.json(response)
    }
}



// 이미 좋아요 누른 사용자인지 확인 후 아니라면 like 테이블에 추가하고 board 테이블의 like 필드의 레코드 값 +1
const likeApi = async (req, res) => {
    let { idx, likeFlag } = req.body
    likeFlag = parseInt(likeFlag)
    //const { userid } = req.userInfo
    const userid = 'admin'
    // likes db에 추가
    const sql1 = `INSERT INTO likes(bid, l_userid) values(${idx},'${userid}')`
    const sql2 = `DELETE FROM likes WHERE bid=${idx} and l_userid='${userid}'`
    let response = {
        errno: 1
    }
    console.log(likeFlag)
    try {
        if (likeFlag === 1) {
            await promisePool.execute(sql2)
        } else {
            await promisePool.execute(sql1)
        }
        response = {
            ...response,
            errno: 0
        }
        res.json(response)
    } catch (e) {
        console.log(e)
        res.json(response)
    }
}

// 이미 스크랩한 사용자인지 확인 후 아니라면 스크랩 테이블에 추가
// ajax
const scrapApi = async (req, res) => {
    const { idx } = req.body
    //const { userid } = req.userInfo
    const userid = 'admin'
    const sql1 = `SELECT * FROM scrap where bid=${idx} and s_userid='${userid}'`
    let response = {
        errno: 1
    }
    try {
        const [result] = await promisePool.execute(sql1)
        if (result[0] !== undefined) {
            response = {
                ...response,
                errMsg: '이미 스크랩한 게시글입니다'
            }
        } else {
            // db에 추가함
            const sql2 = `INSERT INTO scrap(bid, s_userid) VALUES(${idx}, '${userid}')`
            const [result2] = await promisePool.execute(sql2)
            response = {
                ...response,
                errno: 0
            }
        }
        res.json(response)
    } catch (e) {
        console.log(e)
        res.json(response)
    }
}



module.exports = {
    listApi,
    checkLikeApi,
    viewApi,
    deleteApi,
    likeApi,
    scrapApi
}