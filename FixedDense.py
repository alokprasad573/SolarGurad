import tensorflow as tf

class FixedDense(tf.keras.layers.Dense):
    def __init__(self, *args, **kwargs):
        kwargs.pop('quantization_config', None)  # remove unsupported kwarg
        super().__init__(*args, **kwargs)