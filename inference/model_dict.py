from inference.models import Jung, Bresson

MODEL_DICT = {
    'jung-tsp50-m5': {
        'instance': Jung('conv', 10, 11, 2, 128, 512, 6, 2, 8, 1000, 5, True),
        'weights': 'weights/jung-tsp50-m5.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
    },
    'jung-tsp100-m5': {
        'instance': Jung('conv', 10, 11, 2, 128, 512, 6, 2, 8, 1000, 5, True),
        'weights': 'weights/jung-tsp100-m5.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
    },
    'bresson-tsp50': {
        'instance': Bresson(2, 128, 512, 6, 2, 8, 1000, True),
        'weights': 'weights/bresson-tsp50.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
    },
    'bresson-tsp100': {
        'instance': Bresson(2, 128, 512, 6, 2, 8, 1000, True),
        'weights': 'weights/bresson-tsp100.pt',
        'forward': lambda model, x: model.forward(x, 0, True, False)[0],
    }
}