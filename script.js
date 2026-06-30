$("#start_trg").on("click",()=>{
    console.log("start");
    $("#start_trg").attr("disabled",true);
    setTimeout(()=>{
        $("#title_scene").hide();
        window.scroll({top: 0,behavior: "instant"});
        $("#menu_scene").show();
        $("#wait_window p").text("在庫を取得中");
        $("#wait_window").show();
        
        fetch(SERVER_ADDRESS,{
            method:"POST",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
                type:"remain"
            })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }else{
                throw new Error("Network response was not ok");
            }
        })
        .then(data => {
            if(data.result == "OK"){
                console.log(data);
                $("#wait_window").hide();
                for(let [i,id] of Object.entries(Object.keys(order_data))){
                    if(data.remains[i]<=0){
                        $(`#${id}_span #available`).hide();
                        $(`#${id}_span #unavailable`).show();
                    }else{
                        $(`#${id}_span #remain_count`).text(data.remains[i]);
                        order_data[id].remain = data.remains[i];
                    }
                }
            }else{
                throw new Error(`ServerException: ${data.result}`);
            }
        })
        .catch(e => {
            $("#start_trg").attr("disabled",false);
            $("#wait_window").hide();
            $("#menu_scene").hide();
            $("#title_scene").show();
            $("#alert_window p").text(`在庫の取得に失敗しました。少し時間を空けてから再度開始してください。\n(${e.name}:${e.message})`);
            $("#alert_window").show();
            console.error('There was a problem with the fetch operation:', e);
        });
    },1500);
});

$("#main_select_trg").on("click",e=>{
    target = $(e.target);
    if(target.attr("selected")){
        $("#alert_window p").text(`ケバブ(主食)をキャンセルしました。`);
        $("#alert_window").show();
        target.text("かごにいれる");
        target.attr("selected",false);
        order_data.kebab.count=0;
    }else{
        $("#confirm_window p").text(`あなたはチケットを持っていますか？`);
        $("#confirm_window").show();
    }
});

$("#confirm_no_trg").on("click",e=>{
    switch($("#confirm_window p").text()){
        case "あなたはチケットを持っていますか？":
            $("#confirm_window").hide();
            break;
    }
});

$("#confirm_yes_trg").on("click",e=>{
    switch($("#confirm_window p").text()){
        case "あなたはチケットを持っていますか？":
            $("#confirm_window").hide();
            $("#alert_window p").text(`ケバブ(主食)をかごに入れました。`);
            $("#alert_window").show();
            $("#main_select_trg").text("キャンセル");
            $("#main_select_trg").attr("selected",true);
            order_data.kebab.count=1;
            break;
    }
});

$(".increment_trg").on("click",e=>{
    target = $(e.target);
    meal_id = target.data("target");
    console.log(meal_id,order_data[meal_id]);
    if(order_data[meal_id].count == 0){
        target.siblings(".decrement_trg").attr("disabled",false);
    }
    order_data[meal_id].count++;
    if(order_data[meal_id].count == order_data[meal_id].remain || order_data[meal_id].count == order_data[meal_id].max){
        target.attr("disabled",true);
    }
    target.siblings(".text_count").text(order_data[meal_id].count);
});

$(".decrement_trg").on("click",e=>{
    target = $(e.target);
    meal_id = target.data("target");
    console.log(meal_id,order_data[meal_id]);
    if(order_data[meal_id].count == order_data[meal_id].remain || order_data[meal_id].count == order_data[meal_id].max){
        target.siblings(".increment_trg").attr("disabled",false);
    }
    order_data[meal_id].count--;
    if(order_data[meal_id].count == 0){
        target.attr("disabled",true);
    }
    target.siblings(".text_count").text(order_data[meal_id].count);
});



$("#alert_close_trg").on("click",()=>{
    console.log("close");
    $("#alert_window").hide();
});

$("#order_trg").on("click",()=>{
    if(Object.values(order_data).some(v => v.count > 0)){
        console.log(order_data);
        $("#order_list").empty();
        total_price=0;
        for(let [meal_id,order] of Object.entries(order_data)){
            if(order.count>0){
                $("#order_list").append(`<li>${order.name}${meal_id=="kebab" ? "　※主食はチケットを持っていないと食べられません！" : ` × ${order.count}`}</li>`);
                total_price += order.price * order.count;
            }
        }
        $(".total_price").text(`￥${total_price}-`);

        $("#menu_scene").hide();
        window.scroll({top: 0,behavior: "instant"});
        $("#check_scene").show();
    }else{
        $("#alert_window p").text("かごに何も入っていません。");
        $("#alert_window").show();
    }
});

$("#order_cancel_trg").on("click",()=>{
    $("#menu_scene").show();
    window.scroll({top: 0,behavior: "instant"});
    $("#check_scene").hide();
});

$("#order_apply_trg").on("click",()=>{
    $("#wait_window p").text("注文を送信中。最大10秒程度かかります。");
    $("#wait_window").show();

    let order = {};

    for(let [meal_id,order_datum] of Object.entries(order_data)){
        if(order_datum.count>0){
            order[meal_id] = order_datum.count;
        }
    }

    console.log(order);

    fetch(SERVER_ADDRESS,{
        method:"POST",
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            type:"order",
            seat_id:urlParams.get("seat_id"),
            order:order,
        })
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }else{
            throw new Error("Network response was not ok");
        }
    })
    .then(data => {
        if(data.result == "OK"){
            $("#order_id").text(data.order_id);

            $("#waiting_count").text(data.waiting_count);

            window.uuid = data.uuid;

            Cookies.set("rights","removed",{"expires":1e-10});
            
            last_reload_time = Date.now();

            interval_obj = setInterval(()=>{
                console.log("count");
                if(last_reload_time != -1){
                    elapsed_time = Date.now() - last_reload_time;
                    if(elapsed_time < reload_span){
                        $("#remaining_time").text(`更新まで：${Math.round((reload_span-elapsed_time)/1000)}s`);
                    }else if(elapsed_time >= reload_span){
                        last_reload_time = -1

                        $("#remaining_time").text(`読み込み中…`);

                        fetch(SERVER_ADDRESS,{
                            method:"POST",
                            headers: {
                                'Content-Type': 'text/plain'
                            },
                            body: JSON.stringify({
                                type:"waiting_count",
                                uuid:uuid,
                            })
                        })
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            }else{
                                throw new Error("Network response was not ok");
                            }
                        })
                        .then(data => {
                            if(data.result == "OK"){
                                console.log(data);
                                last_reload_time = Date.now();
                                $("#waiting_count").text(data.waiting_count);
                            }else if(data.result == "Done"){
                                clearInterval(interval_obj);
                                console.log(data);
                                $("#receipt_scene").hide();
                                $("#complete_scene").show();
                            }else if(data.result == "UuidDoesNotExist"){
                                clearInterval(interval_obj);
                                console.log(data);
                                $("#alert_window p").text(`サーバー上で注文が記録されていませんでした。注文が混雑している可能性があるので、注文を最初からやり直してください。\n(Error: ServerException: UuidDoesNotExist)`);
                                Cookies.set("rights","PSrpbtx3wscOYxBB",{"expires":1/24/12});
                                $("#alert_close_trg").on("click",()=>{location.reload()});
                                $("#alert_window").show();
                            }else{
                                throw new Error(`ServerException: ${data.result}`);
                            }
                        })
                        .catch(e => {
                            last_reload_time = Date.now();
                            console.error('There was a problem with the fetch operation:', e);
                        });
                    }
                }
            },1000);

            $("#check_scene").hide();
            $("#wait_window").hide();
            window.scroll({top: 0,behavior: "instant"});
            $("#receipt_scene").show();
        }else if(data.result == "RemainShortage"){
            $("#wait_window").hide();
            $("#alert_window p").text(`ページを開いてから注文するまでの間に売り切れた料理がある可能性があります。注文を最初からやり直してください。\n(Error: ServerException: RemainShortage)`);
            Cookies.set("rights","PSrpbtx3wscOYxBB",{"expires":1/24/12});
            $("#alert_close_trg").on("click",()=>{location.reload()});
            $("#alert_window").show();
        }else{
            throw new Error(`ServerException: ${data.result}`);
        }

        
    })
    .catch(e => {
        $("#wait_window").hide();
        $("#alert_window p").text(`注文の送信に失敗しました。少し時間を空けてから再度送信してください。\n(${e.name}:${e.message})`);
        $("#alert_window").show();
        console.error('There was a problem with the fetch operation:', e);
    });
});

window.last_reload_time = -1;
window.reload_span = 30000;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
$("#seat_id").text(urlParams.get("seat_id"));

if(Cookies.get("rights") == "PSrpbtx3wscOYxBB"){
    $("#title_scene").show();
}else{
    location.replace("timeover.html");
}

window.order_data = {
    "kebab":{
        "count":0,
        "price":0,
        "remain":0,
        "max":0,
        "name":"ケバブ"
    },
    "nope":{
        "count":0,
        "price":30,
        "remain":0,
        "max":3,
        "name":"NOPE"
    },
    "ice":{
        "count":0,
        "price":50,
        "remain":0,
        "max":3,
        "name":"かき氷"
    },
    "crepe":{
        "count":0,
        "price":50,
        "remain":0,
        "max":3,
        "name":"クレープ"
    },
    "chicken":{
        "count":0,
        "price":40,
        "remain":0,
        "max":3,
        "name":"焼き鳥"
    },
    "doritos":{
        "count":0,
        "price":30,
        "remain":0,
        "max":3,
        "name":"ドンタコス"
    }
};

window.SERVER_ADDRESS = "https://script.google.com/macros/s/AKfycbzcC6BAv4YC3DLHGX4RxLZL1ro8YcS-KJJwauU8rZSp0weYaekcyuMI-EQOfGJcwsW0Kw/exec";