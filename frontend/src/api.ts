import type { Machine, Order } from "./types"

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(path, options)
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
            const errorData = await response.json()
            if (typeof errorData?.error === 'string') {
                errorMessage = errorData.error
            }
        } catch {

        }
        throw new Error(errorMessage)
    }
    const data = await response.json()
    return data
}

export async function getMachines():Promise<Machine[]> {
    const path = '/api/machines'
    return fetchJson<Machine[]>(path);    
}

export async function getOrders():Promise<Order[]> {
    const path = '/api/orders'
    return fetchJson<Order[]>(path);    
}

export async function createMachine(data: {name: string}): Promise<Machine> {
    const path  = '/api/machines'
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    return fetchJson<Machine>(path, options)
}

export async function createOrder(data: { number: string; name: string }): Promise<Order> {
    const path  = '/api/orders'
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    return fetchJson<Order>(path, options)
}

export async function updateMachine(id: number, data: {name?: string, isActive?: boolean}): Promise<Machine> {
    const path  = `/api/machines/${id}`
    const options = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    return fetchJson<Machine>(path, options)
}

export async function updateOrder(id: number, data: {status: 'completed' }): Promise<Order> {
    const path  = `/api/orders/${id}`
    const options = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }
    return fetchJson<Order>(path, options)
}