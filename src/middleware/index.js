let publicMiddle = []

let privateMddile = []

function execute(info, type) {
    var arr = null
    switch (type) {
        case "publicMiddle": arr = publicMiddle; break;
        case "privateMddile": arr = privateMddile; break;
        default: arr = [];
    }
    try {
        dispatch(0)()
    } catch (e) {
        console.error(e)
        if (window.fireLog) {
            window.fireLog.error(e.stack)
        }
    }
    function dispatch(i) {
        return () => {
            if (i < arr.length) {
                Promise.resolve(arr[i](info, dispatch(i + 1)))
            }
        }
    }
}

function executePublic(info) {
    execute(info, "publicMiddle")
}

function executePrivate(info) {
    execute(info, "privateMddile")
}

function use(func, type) {
    switch (type) {
        case "publicMiddle": publicMiddle.push(func); break;
        case "privateMddile": privateMddile.push(func); break;
        default: ;
    }
}

function usePublic(func) {
    if (typeof func === "function") {
        use(func, "publicMiddle")
    }
}

function usePrivate(func, window) {
    if (typeof func === "function") {
        use(func, "privateMddile")
    }
    if (window && window.addEventListener)
        window.addEventListener("hashchange", clearPrivate)
}

function clearPrivate() {
    if (typeof name === "string") {
        privateMddile = privateMddile.filter(item => item.name !== name)
        return;
    }
    if (name instanceof Array) {
        privateMddile = privateMddile.filter(item => name.findIndex(item) < 0)
        return;
    }
    privateMddile = [];
}

export { executePrivate, executePublic, usePublic, usePrivate, clearPrivate }